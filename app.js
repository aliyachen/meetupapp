var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var multer = require('multer');
var fs = require('fs');
var moment = require('moment');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/meetupapp');
var db = mongoose.connection;
var users = require('./routes/users');
var User = require('./models/user');
//init app
var app = express();

//view engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

//bodyparser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

//express session
app.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
}));

//passport init
app.use(passport.initialize());
app.use(passport.session());

//express validator
app.use(expressValidator({
	errorFormatter: function(param, msg, value) {
		var namespace = param.split('.')
		, root = namespace.shift()
		, formParam = root;

		while(namespace.length) {
			formParam += '[' + namespace.shift() + ']';
		}
		return {
			param : formParam,
			msg   : msg,
			value : value
 		};
	}

}));

//connect flash
app.use(flash());

//global variables
app.use(function(req, res, next){
	res.locals.sucess_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	next();
});

//app.use('/', routes);
app.use('/users', users);
// app.use('/meetups', meetups);

//set port
app.set('port', (process.env.PORT || 3000));


var Meetup = mongoose.model('Meetup', {
	meetupName: {
		type: String,
		required:true
	},
	creator: {
		type: String
	},
	participants: [{
    	type: String
	}],
	type: {
		type: String,
		required: true
	},
	startdate: {
		type: String
	},
	enddate: {
		type: String
	},
	location: {
		type: String
	},
	notes: {
		type: String
	},
	img: {
		type: String
	},
	status: {
		type: String,
		default: 'current'
	},
	userid: {
		type: String
	}
})


//end setup 


//ensure authentication
function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg', 'You are not logged in');
		res.redirect('/users/login');
	}
}





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


//sort meetups by date
function sortByDate(arrayOfMeetups) {
	arrayOfMeetups.sort (function (a, b) {
    	var asplitwhite = (a.startdate).split(" ");
    	var adatenottime = asplitwhite[0];
    	var bsplitwhite = (b.startdate).split(" ");
    	var bdatenottime = bsplitwhite[0];
   		var aComps = (adatenottime).split("/");
   		var bComps = (bdatenottime).split("/");
    	var aDate = new Date(aComps[2], aComps[0], aComps[1]);
    	var bDate = new Date(bComps[2], bComps[0], bComps[1]);
    	var value = aDate.getTime() - bDate.getTime();
    	if (value == 0) {
    		var atime = asplitwhite[1] + " " + asplitwhite[2].toLowerCase();
    		var btime = bsplitwhite[1] + " " + bsplitwhite[2].toLowerCase();
    		value = new Date('2000/01/01 ' + atime) - new Date('2000/01/01 ' + btime);
    	} 
    	return value;
	});
}

function getUserMeetups(user, meetupArray, status, done) {
	var meetupslist = user.meetupslist;
	async.each(meetupslist, function(meetupId, next) {
		Meetup.findById(meetupId, function (err, meetup) {
			console.log("hello???");
			if (err) {
				console.log(err);
			}
			else  {
				console.log(meetup.meetupName);
				if (meetup.status == status) {
					console.log("im pusshing");
					meetupArray.push(meetup);
				}
			next();
			}
		})
	}, function(err) {
		console.log("not supposed to be here");
		sortByDate(meetupArray);
		done(null, meetupArray)
	});
}

function renderUserMeetups(user, userview, res, renderurl, title, friends) {
	var meetupArray = [];
	async.waterfall([
		function first(done) {
			getUserMeetups(user, meetupArray, 'current', done);
		},
		function second(meetupArray, done) {
			console.log("beter not be here");
			meetupArray = meetupArray;
			done(null, meetupArray)
		},
		function third(meetupArray, done) {
			res.render(renderurl, {
				title: title,
				user: user,
				userview: userview,
				meetups: meetupArray,
				friends: friends
			});
			done(null)
		}
	], function (err) {
		if (err) {
			console.log(err);
		}
	});

}
//read
app.get('/', ensureAuthenticated, function(req, res) {
		console.log(req.user);
	// 	var query = { status: 'current', userid: req.user.id };
	// Meetup.find(query, function(err, arrayOfMeetups) {
	// 	 sortByDate(arrayOfMeetups);
	// 	res.render('index', {
	// 		user: req.user,
	// 		meetups: arrayOfMeetups
	// 	});
	// });

	renderUserMeetups(req.user, null, res, 'index', 'My Meetups', false);
	// var meetupArray = [];
	// async.waterfall([
	// 	function first(done) {
	// 		getUserMeetups(req.user, meetupArray, 'current', done);
	// 	},
	// 	function second(meetupArray, done) {
	// 		console.log("beter not be here");
	// 		meetupArray = meetupArray;
	// 		done(null, meetupArray)
	// 	},
	// 	function third(meetupArray, done) {
	// 		res.render('index', {
	// 			title: 'My Meetups',
	// 			user: req.user,
	// 			meetups: meetupArray
	// 		});
	// 		done(null)
	// 	}
	// ], function (err) {
	// 	if (err) {
	// 		console.log(err);
	// 	}
	// });
});



//get image gallery
app.get('/gallery', ensureAuthenticated, function (req, res) {
	var query = { userid: req.user.id };
	Meetup.find(query, function(err, arrayOfMeetups){
		sortByDate(arrayOfMeetups);
		arrayOfMeetups.reverse();
		res.render('gallery', { 
			meetups: arrayOfMeetups,
			user: req.user
		});
	});
	
});


//get calendar
app.get('/calendar', ensureAuthenticated, function (req, res) {
	var meetupArray = [];
	var events = [];
	async.waterfall([
		function first(done) {
			getUserMeetups(req.user, meetupArray, 'current', done);
		},
		function second(meetupArray, done) {
			meetupArray = meetupArray;
			meetupArray.forEach(function(e) {
				var startstr = e.startdate;
				if (startstr.charAt(12) == ':') {
					startstr = startstr.slice(0, 11) + '0' + startstr.slice(11, 16);
				}
		 		var startmonth = startstr.slice(0, 2);
 			   	var startday = startstr.slice(3, 5);
		    	var startyear = startstr.slice(6, 10);
  		  		var starthour = startstr.slice(11, 13);
    			var startmin = startstr.slice(14, 16);
    			var startdate = startyear + "-" +  startmonth + "-" + startday + " " + starthour + ":" + startmin + ":00";
    			startdate = (moment(startdate).unix() )*1000;
    			console.log(startdate);

				var endstr = e.startdate;
				if (endstr.charAt(12) == ':') {
					endstr = endstr.slice(0, 11) + '0' + endstr.slice(11, 16);
				}
 				var endmonth = endstr.slice(0, 2);
    			var endday = endstr.slice(3, 5);
    			var endyear = endstr.slice(6, 10);
    			var endhour = endstr.slice(11, 13);
    			var endmin = endstr.slice(14, 16);
    			var enddate = endyear + "-" +  endmonth + "-" + endday + " " + endhour + ":" + endmin + ":00";
    			enddate = (moment(enddate).unix() )*1000;
    			console.log(enddate);
    			console.log(e.meetupName);
    			events.push({
    				start: startdate,
    				end: enddate,
    				title: e.meetupName
    			});
    		});
			done(null, meetupArray, events)
		},
		function third(meetupArray, events, done) {
			res.render('calendar', { 
				meetups: meetupArray,
				user: req.user,
				events: events
			});
			done(null)
		}
	], function (err) {
		if (err) {
			console.log(err);
		}
	});
	
});



//create
app.get('/createMeetup', ensureAuthenticated, function (req, res) {
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
	console.log("user: " + req.user.id);
	res.render('createMeetup', { 
		user: req.user,
		date: today
	});
});
app.post('/createMeetup', function(req, res){
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
		res.redirect('/');
	});
})



//view meetup
app.get('/view/:id/', ensureAuthenticated, function(req, res) {
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
app.get('/edit/:id/', ensureAuthenticated, function(req, res) {
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
app.post('/update/:id', upload.single('imgUploader'), function(req, res) {
	console.log("Reached")
	var id = req.params.id;
	if (req.file) {
		Meetup.findById(id, function(err, meetup){
			meetup.meetupName = req.body.updated_meetupName,
			meetup.participants = req.body.updated_participants,
			meetup.type = req.body.updated_type,
			meetup.startdate = req.body.updated_startdate,
			meetup.enddate = req.body.updated_enddate,
			meetup.location = req.body.updated_location,
			meetup.notes = req.body.updated_notes,
			meetup.img = req.file.filename,
			meetup.save( function(err) {
				if(err) {
					console.log(err);
				} else {
					console.log("saved");
				}
			});
			return res.redirect('/');
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
    							var pindex = meetup.participants.indexOf(user.username);
    								//if user is not in the list of participants
    								if (pindex < 0) {
    									var index = user.meetupslist.indexOf(meetup.id);
    									console.log("index should not be -1: " + index);
										if (index > -1) {
											user.meetupslist.splice(index, 1);
										}
										user.save();
    								}
    							}
    						})
    					}
 					});
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
					console.log("saved");
				}
			});
			return res.redirect('/');
		});
	}
})

//delete
app.get('/delete/:id', function(req, res) {
	var id = req.params.id;
	Meetup.findById(id, function(err, meetup) {
		if (!err) {
			if (meetup.creator == req.user.username) {
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
			console.log("index to remove: " + index);
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
	return res.redirect('/');
})

//archive
app.get('/archive/:id', function(req, res) {
	var id = req.params.id;
	console.log("ARCHIVE ID: " + id)
	Meetup.findById(id, function(err, meetup){
		meetup.status = 'past',
		meetup.save( function(err) {
			if(err) {
				console.log("why");
				console.log(err);
			} else {
				console.log("ok why working");
			}
		});
		req.user.save();
		return res.redirect('/');
	});
})

//restore
app.get('/restore/:id', function(req, res) {
	var id = req.params.id;
	Meetup.findById(id, function(err, meetup){
		meetup.status = 'current',
		meetup.save( function(err) {
			if(err) {
				console.log("why");
				console.log(err);
			} else {
				console.log("ok why working");
			}
		});
		req.user.save();
		return res.redirect('/archive');
	});
})

function getUserMeetupsByCategory(user, type, meetupArray, done) {
	var meetupslist = user.meetupslist;
	async.each(meetupslist, function(meetupId, next) {
		Meetup.findById(meetupId, function (err, meetup) {
			console.log("hello???");
			if (err) {
				console.log(err);
			}
			else  {
				console.log(meetup.meetupName);
				if (meetup.status == 'current' && meetup.type == type) {
					console.log("im pusshing");
					meetupArray.push(meetup);
				}
			next();
			}
		})
	}, function(err) {
		console.log("not supposed to be here");
		sortByDate(meetupArray);
		done(null, meetupArray)
	});
}

//get meetups by category
getCategoryPages('/catchup', 'Catch-up', 'Catch-ups');
getCategoryPages('/studydate', 'Study Date', 'Study Dates');
getCategoryPages('/businessmeeting', 'Business Meeting', 'Business Meetings');
getCategoryPages('/clubmeeting', 'Club Meeting', 'Club Meetings');
getCategoryPages('/party', 'Party', 'Parties');
getCategoryPages('/other', 'Other', 'Miscellaneous Meetups');

function getCategoryPages(url, type, pagetitle) {
	app.get(url, ensureAuthenticated, function(req, res) {
		var meetupArray = [];
		async.waterfall([
			function first(done) {
				getUserMeetupsByCategory(req.user, type, meetupArray, done);
			},
			function second(meetupArray, done) {
				meetupArray = meetupArray;
				done(null, meetupArray)
			},
			function third(meetupArray, done) {
				res.render('index', {
					title: pagetitle,
					user: req.user,
					meetups: meetupArray
				});
				done(null)
			}
		], function (err) {
			if (err) {
				console.log(err);
			}
		});
	})
}

//archived meetups
app.get('/archive', ensureAuthenticated, function(req, res) {
		console.log(req.user);
	var meetupArray = [];
	async.waterfall([
		function first(done) {
			getUserMeetups(req.user, meetupArray, 'past', done);
		},
		function second(meetupArray, done) {
			meetupArray = meetupArray;
			done(null, meetupArray)
		},
		function third(meetupArray, done) {
			res.render('archive', {
				title: 'Past Meetups',
				user: req.user,
				meetups: meetupArray
			});
			done(null)
		}
	], function (err) {
		if (err) {
			console.log(err);
		}
	});
});



app.get('/users', ensureAuthenticated, function(req, res) {
	var friendArray = [];
	var admin = false;
	if (req.user.username == 'aliya') {
		admin = true;
	}
	async.waterfall([
		function first(done) {
			getUserFriends(req.user, friendArray, done);
		},
		function second(friendArray, done) {
			friendArray = friendArray;
			done(null, friendArray)
		},
		function third (friendArray, done) {
			var userarray = [];
			User.find(function (err, arrayOfUsers) {
    			if (err) {
    				console.log('cannot find users');
    			} else {
    				//don't display yourself
    				var index = 0;
    				for (var i = 0; i < arrayOfUsers.length; i++) {
    					if(arrayOfUsers[i].id == req.user.id) {
    						index = i;
    					}
    				}
    				//don't display friends in all users list
    				arrayOfUsers.splice(index, 1);
    				for (var i = 0; i < friendArray.length; i++) {
    					for (var j = 0; j < arrayOfUsers.length; j++) {
    						if(arrayOfUsers[j].id == friendArray[i].id) {
    							index = j;
    						}
    					}
    					arrayOfUsers.splice(index, 1);
    				}
    				userarray = arrayOfUsers;
    				done(null, friendArray, userarray)
   			 	}
  			});
		},
		function fourth(friendArray, userarray, done) {
			 res.render('users', { 
    			title: 'Connections',
    			userList: userarray,
    			friendsList : friendArray,
    			allusers: true,
    			admin: admin
    		});
			done(null)
		}
	], function (err) {
		if (err) {
			console.log(err);
		}
	});
});


function getUserFriends(user, friendArray, done) {
	var friendslist = user.friendslist;
	async.each(friendslist, function(friendsId, next) {
		User.findById(friendsId, function (err, friend) {
			if (err) {
				console.log(err);
			}
			else  {
				console.log(friend.name);
				friendArray.push(friend);
			next();
			}
		})
	}, function(err) {
		//sortByAlphabetical(friendArray);
		done(null, friendArray)
	});
}



function getUserFriendRequests(user, friendArray, done) {
	var friendslist = user.friendrequests;
	async.each(friendslist, function(friendsId, next) {
		User.findById(friendsId, function (err, friend) {
			if (err) {
				console.log(err);
			}
			else  {
				friendArray.push(friend);
			next();
			}
		})
	}, function(err) {
		//sortByAlphabetical(friendArray);
		done(null, friendArray)
	});
}

app.get('/friendrequests', ensureAuthenticated, function(req, res) {
	var friendreqArray = [];
	async.waterfall([
		function first(done) {
			getUserFriendRequests(req.user, friendreqArray, done);
		},
		function second(friendArray, done) {
			friendreqArray = friendreqArray;
			done(null, friendArray)
		},
		function third(friendArray, done) {
			 res.render('users', { 
    			title: 'Friend Requests',
    			userList : friendArray,
    			allusers: false,
    			friendrequests: true
    		});
			done(null)
		}
	], function (err) {
		if (err) {
			console.log(err);
		}
	});
});

app.get('/requestfriend/:id', function(req, res) {
	console.log("request friend of" + req.params.id);
	console.log(req.user.id);
	var thisid = req.user.id;
	var thatid = req.params.id;
	User.findById(thatid, function(err, user) {
		if (!err) {

			var index = -1;
			user.friendrequests.some(function(obj, idx){
				if (obj._id.toString() === thisid.toString()) {
					index = idx;
					return true;
				}
			});
			if (index < 0) {
    			user.friendrequests.push(thisid);
				user.save();
			}
		} else {
			console.log(err);
		}
	});
  res.redirect('/');
})

app.get('/acceptfriend/:id', function(req, res) {
	var thisid = req.user.id;
	var thatid = req.params.id;
	User.findById(thisid, function(err, user) {
		if (!err) {
			var findex = -1;
			user.friendslist.some(function(obj, idx) {
				if (obj._id.toString() === thatid.toString()) {
					findex = idx;
					return true;
				}
			});
			if (findex < 0) {
    			user.friendslist.push(thatid);
			}
			var index = -1;
			user.friendrequests.some(function(obj, idx) {
				if (obj._id.toString() === thatid.toString()) {
					index = idx;
					return true;
				}
			});
			if (index > -1) {
				user.friendrequests.splice(index, 1);
			}
			user.save();

		} else {
			console.log(err);
		}
	});
	User.findById(thatid, function(err, user) {
		if (!err) {
			var findex = -1;
			user.friendslist.some(function(obj, idx){
				if (obj._id.toString() === thisid.toString()) {
					findex = idx;
					return true;
				}
			});
			if (findex < 0) {
    			user.friendslist.push(thisid);
			}
			var index = -1;
			user.friendrequests.some(function(obj, idx){
				if (obj._id.toString() === thisid.toString()) {
					index = idx;
					return true;
				}
			})
			if (index > -1) {
				user.friendrequests.splice(index, 1);
			}
			user.save();
		} else {
			console.log(err);
		}
	});
  res.redirect('/');
})

app.get('/removefriend/:id', function(req, res) {
	var thisid = req.user.id;
	var thatid = req.params.id;
	//remove friend from both users
	User.findById(thisid, function(err, user) {
		if (!err) {
			var index = user.friendslist.indexOf(thatid);
			user.friendslist.splice(index, 1);
			user.save();

		} else {
			console.log(err);
		}
	});
	User.findById(thatid, function(err, user) {
		if (!err) {
			var index = user.friendslist.indexOf(thisid);
			user.friendslist.splice(index, 1);
			user.save();

		} else {
			console.log(err);
		}
	});
  res.redirect('/');
})

//view my profile
app.get('/profile', ensureAuthenticated, function(req, res) {
	var id = req.user.id;
	User.findOne({
		_id: id
	}, function(err, user) {
		renderUserMeetups(req.user, user, res, 'profile', user.name, true);
	});
})

//view other user profile
app.get('/profile/:id', ensureAuthenticated, function(req, res) {
	var id = req.params.id;
	User.findById(req.params.id, function(err, user) {
		if (!err) {
			var index = -1;
			req.user.friendslist.some(function(obj, idx){
				if (obj._id.toString() === id.toString()) {
					index = idx;
					return true;
				}
			})
			//display details if friends
			if (index > -1) {
				renderUserMeetups(req.user, user, res, 'profile', user.name, true);
			} else {
				res.render('profile', {
					userid: id,
					requestlink: "/requestfriend/" + id,
					user: req.user,
					userview: user,
					friends: false
				});
			}
		} else {
			console.log(err);
		}
	});
})


app.get('/deleteuser/:id', function(req, res) {
	console.log(req.params.id);
	var username = "";
	User.findById(req.params.id, function(err, user) {
		if (!err) {
			username = user.username;
			user.remove();
		} else {
			console.log(err);
		}
	});
	User.find(function (err, arrayOfUsers) {
    	if (err) {
    		console.log('cannot find users');
    	} else {
    		arrayOfUsers.forEach(function (user) {
    			var index = user.friendslist.indexOf(req.params.id);
				if (index > -1) {
					user.friendslist.splice(index, 1);
				}
				user.save();
    		})
    	};
 	});
 	Meetup.find(function (err, arrayOfMeetups) {
 		if (err) {
    		console.log('cannot find meetups');
    	} else {
    		arrayOfMeetups.forEach(function (meetup) {
    			var index = meetup.participants.indexOf(username);
				if (index > -1) {
					meetup.participants.splice(index, 1);
				}
				meetup.save();
    		})
    	};
 	})
	return res.redirect('/');
})

app.get('/deleteaccount/:id', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (!err) {
			user.remove();
		} else {
			return err
		}
	});
	return res.redirect('/');
})

//start


app.listen(app.get('port'), function() {
	console.log('Server started on port '+app.get('port'));
});