var express = require('express');
var router = express.Router();
var Meetup = require('../models/meetup');
var User = require('../models/user');
var users = require('../routes/users');
var session = require('express-session');
var passport = require('passport');
var multer = require('multer');

router.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
}));

//passport init
router.use(passport.initialize());
router.use(passport.session());


router.use('/users', users);

//ensure authentication
function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg', 'You are not logged in');
		res.redirect('/users/login');
	}
};


//upload images
//set storage
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, 'public/uploads/')
	},
	filename: function(req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now() + (file.originalname));
	}
});

//init upload
var upload = multer({
	storage: storage,
});

//create
router.get('/createMeetup', ensureAuthenticated, function (req, res) {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	if(dd<10) {
    	dd = '0'+dd
	} 
	if(mm<10) {
   	 mm = '0'+mm
	} 
	today = mm + '/' + dd + '/' + yyyy;
	res.render('createMeetup', { 
		user: req.user,
		date: today
	});
});

router.post('/createMeetup', function(req, res){
	var meetup = new Meetup({
		meetupName: req.body.meetupName,
		creator: req.user.username,
		participants: req.body.participants,
		type: req.body.type,
		startdate: req.body.startdate,
		enddate: req.body.enddate,
		location: req.body.location,
		notes: req.body.notes,
		status: req.body.status,
	});
	meetup.save(function(err){
		meetup.participants.forEach(function (participant) {
			User.getUserByUsername(participant, function(err, user){
  				if(err) throw err;
  				if(user){
  					user.meetupslist.push(meetup.id);
  					user.save();
			  	}
			});
		})
		req.user.meetupslist.push(meetup.id);
		req.user.save();
		Meetup.find(function(err, toHBS) {
			if (err) {
				console.log("Failed to save meetup");
			} else {
				meetups: toHBS
			}
		});
		res.redirect('/profile');
	});
});

//view meetup
router.get('/view/:id/', ensureAuthenticated, function(req, res) {
	var id = req.params.id;
	Meetup.findOne({
		_id: id
	}, function(err, doc) {
		res.render('view', {
			meetupid: id,
			meetups: doc
		});
	});
})

//update
router.get('/edit/:id/', ensureAuthenticated, function(req, res) {
	var id = req.params.id;
	Meetup.findOne({
		_id: id
	}, function(err, doc) {
		res.render('view', {
			edit: true,
			meetups: doc
		});
	});
})

//update
router.post('/update/:id', upload.array('imgUploader', 10), function(req, res) {
	var files = [];
	for (var i = 0; i < req.files.length; i++) {
		files[i] = req.files[i].filename;
	}

	var id = req.params.id;
	var meetupHasImage = false;
	Meetup.findById(id, function(err, meetup) {
		if (meetup.img.length > 0) {
			meetupHasImage = true;
		}
	})
	if (files.length > 0) {
		Meetup.findById(id, function(err, meetup){
			meetup.meetupName = req.body.updated_meetupName,
			meetup.participants = req.body.updated_participants,
			meetup.type = req.body.updated_type,
			meetup.startdate = req.body.updated_startdate,
			meetup.enddate = req.body.updated_enddate,
			meetup.location = req.body.updated_location,
			meetup.notes = req.body.updated_notes,
			meetup.img = files,
			meetup.save( function(err) {
				if(err) {
					console.log(err);
				} else {
					console.log("saved");
				}
			});
			return res.redirect('/profile');
		});
	} else {
		Meetup.findById(id, function(err, meetup){
			meetup.meetupName = req.body.updated_meetupName,
			meetup.participants = req.body.updated_participants,
			meetup.type = req.body.updated_type,
			meetup.startdate = req.body.updated_startdate,
			meetup.enddate = req.body.updated_enddate,
			meetup.location = req.body.updated_location,
			meetup.notes = req.body.updated_notes,
			meetup.img = meetup.img,
			meetup.save( function(err) {
				if(err) {
					console.log(err);
				} else {
					User.find(function (err, arrayOfUsers) {
    					if (err) {
    						console.log('cannot find users');
    					} else {
    						arrayOfUsers.forEach(function (user) {
    							if (user.username != meetup.creator) {
    								if (meetup.participants) {
    									
    							var pindex = meetup.participants.indexOf(user.username);
    								//if user is not in the list of participants
    								if (pindex < 0) {
    									var index = user.meetupslist.indexOf(meetup.id);
										if (index > -1) {
											user.meetupslist.splice(index, 1);
										}
										user.save();
    								}
    							}
    								}
    						})
    					}
 					});
 					if (meetup.participants) {
 						meetup.participants.forEach(function (participant) {
						User.getUserByUsername(participant, function(err, user){
  							if(err) throw err;
  							if(user){
  								var index = user.meetupslist.indexOf(meetup.id);
  								if (index < 0) {
  									user.meetupslist.push(meetup.id);
  									user.save();
  								}
			  				}
						});
					});
 					}
					
					console.log("saved");
				}
			});
			return res.redirect('/profile');
		});
	}
})

//delete
router.get('/delete/:id', function(req, res) {
	var id = req.params.id;
	Meetup.findById(id, function(err, meetup) {
		if (!err) {
			if (meetup.creator == req.user.username) {
				console.log("CREATE REMOVED");
				//if creator removed a meetup, remove meetup entirely and remove from all participant lists
				meetup.remove();
				meetup.participants.forEach(function (participant) {
					User.getUserByUsername(participant, function(err, user){
  						if(err) throw err;
  						if(user){
  							var uindex = user.meetupslist.indexOf(id);
  							if (uindex > -1) {
    							user.meetupslist.splice(uindex, 1);
							}
  							user.save();
			  			}
					});
				})
			}
			//if not creator, remove meetup from personal list, remove him/herself from participant list
			var index = req.user.meetupslist.indexOf(id);
			var newArray = req.user.meetupslist.slice();
			if (index > -1) {
    			newArray.splice(index, 1);
    			req.user.meetupslist = newArray;
			}
			req.user.save();
			var pindex = meetup.participants.indexOf(req.user.username);
			if (pindex > -1) {
				meetup.participants.splice(pindex, 1);
			}
			meetup.save();
		} else {
			return err
		}
	});
	return res.redirect('/profile');
})

//archive
router.get('/archive/:id', function(req, res) {
	var id = req.params.id;
	Meetup.findById(id, function(err, meetup){
		meetup.status = 'past',
		meetup.save( function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log("ok why working");
			}
		});
		req.user.save();
		return res.redirect('/profile');
	});
})

//restore
router.get('/restore/:id', function(req, res) {
	var id = req.params.id;
	Meetup.findById(id, function(err, meetup){
		meetup.status = 'current',
		meetup.save( function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log("ok why working");
			}
		});
		req.user.save();
		return res.redirect('/profile');
	});
})

module.exports = router;
