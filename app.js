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
		type: Array
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

//sort users alphabetically
function sortAlphabetically(arrayOfUsers) {
	arrayOfUsers.sort (function (a, b) {
    	return a.name.localeCompare(b.name);
	});
}

function getUserMeetups(user, meetupArray, status, done) {
	var meetupslist = user.meetupslist;
	async.each(meetupslist, function(meetupId, next) {
		Meetup.findById(meetupId, function (err, meetup) {
			if (err) {
				console.log(err);
			}
			else  {
				console.log(meetup.meetupName);
				if (meetup.status == status) {
					meetupArray.push(meetup);
				}
			next();
			}
		})
	}, function(err) {
		sortByDate(meetupArray);
		done(null, meetupArray)
	});
}


function renderUserMeetups(user, userview, res, renderurl, title, friends) {
	var meetupArray = [];
	var friendArray = [];
	async.waterfall([
		function first(done) {
			getUserMeetups(userview, meetupArray, 'current', done);
		},
		function second(meetupArray, done) {
			meetupArray = meetupArray;
			done(null, meetupArray)
		},
		function third(meetupArray, done) {
			var userequals = false;
			if (user.id.toString() == userview.id.toString()) {
				userequals = true;
			}
			res.render(renderurl, {
				title: title,
				user: user,
				userview: userview,
				meetups: meetupArray,
				friends: friends,
				userequals: userequals
			});
			done(null)
		}
	], function (err) {
		if (err) {
			console.log(err);
		}
	});

}


function getUserMeetupsIndex(user, meetupArray1, meetupArray2, status1, done) {
	var meetupslist = user.meetupslist;
	async.each(meetupslist, function(meetupId, next) {
		Meetup.findById(meetupId, function (err, meetup) {
			if (err) {
				console.log(err);
			}
			else  {
				if (meetup.status == status1) {
					meetupArray1.push(meetup);
				} else {
					meetupArray2.push(meetup);
				}
			next();
			}
		})
	}, function(err) {
		sortByDate(meetupArray2);
		sortByDate(meetupArray2)
		done(null, meetupArray1, meetupArray2)
	});
}

function getUserFriendsIndex(user, userview, friendArray, meetupArray, meetupArray2, done) {
	var friendslist = userview.friendslist;
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
		sortAlphabetically(friendArray);
		done(null, meetupArray, meetupArray2, friendArray)
	});
}

function renderUserMeetupsCalendar(user, userview, res, renderurl, title, friends, userequals) {
	var meetupArray = [];
	var meetupArray2 = [];
	var friendArray = [];
	var events = [];
	async.waterfall([
		function first(done) {
			getUserMeetupsIndex(userview, meetupArray, meetupArray2, 'current', done);
		},
		function second(meetupArray, meetupArray2, done) {
			getUserFriendsIndex(user, userview, friendArray, meetupArray, meetupArray2, done);
		},
		function third(meetupArray, meetupArray2, friendArray, done) {
			meetupArray = meetupArray;
			meetupArray2 = meetupArray2;
			friendArray - friendArray;
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
    			var startdate = startyear + "-" +  startmonth + "-" + startday + "T" + starthour + ":" + startmin + ":00";

				var endstr = e.startdate;
				if (endstr.charAt(12) == ':') {
					endstr = endstr.slice(0, 11) + '0' + endstr.slice(11, 16);
				}
 				var endmonth = endstr.slice(0, 2);
    			var endday = endstr.slice(3, 5);
    			var endyear = endstr.slice(6, 10);
    			var endhour = endstr.slice(11, 13);
    			var endmin = endstr.slice(14, 16);
    			var enddate = endyear + "-" +  endmonth + "-" + endday + "T" + endhour + ":" + endmin + ":00";
    			events.push({
    				start: startdate,
    				end: enddate,
    				title: e.meetupName,
    				url: '/view/' + e.id + '/',
    				backgroundColor: '#A9A9A9',
    				borderColor: '#A9A9A9'
    			});
    		});
			done(null, meetupArray, meetupArray2, friendArray, events)
		},
		function fourth(meetupArray, meetupArray2, friendArray, events, done) {
			res.render(renderurl, {
				title: title,
				user: user,
				userview: userview,
				meetups: meetupArray,
				pastmeetups: meetupArray2,
				events: JSON.stringify(events),
				friends: friends,
				friendsList: friendArray,
				userequals: userequals,
				index: true
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
	renderUserMeetupsCalendar(req.user, req.user, res, 'profile', 'Upcoming', false, true);
});



//get image gallery
app.get('/gallery', ensureAuthenticated, function (req, res) {
	var meetupArray = [];
	async.waterfall([
		function first(done) {
			var meetupslist = req.user.meetupslist;
			async.each(meetupslist, function(meetupId, next) {
				Meetup.findById(meetupId, function (err, meetup) {
					if (err) {
						console.log(err);
					}
					else  {
						meetupArray.push(meetup);
						next();
					}
				})
			}, function(err) {
				sortByDate(meetupArray);
				done(null, meetupArray)
			});
		},
		function second(meetupArray, done) {
			meetupArray = meetupArray;
			done(null, meetupArray)
		},
		function third(meetupArray, done) {
			meetupArray.reverse();
			res.render('gallery', {
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
		res.redirect('/profile');
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
app.post('/update/:id', upload.array('imgUploader', 10), function(req, res) {
	var files = [];
	for (var i = 0; i < req.files.length; i++) {
		files[i] = req.files[i].filename;
	}

	var id = req.params.id;
	var meetupHasImage = false;
	Meetup.findById(id, function(err, meetup) {
		console.log("meetupimagelength: " + meetup.img.length);
		if (meetup.img.length > 0) {
			meetupHasImage = true;
		}
	})
	if (files.length > 0) {
		console.log("REQ HAS FILES?????");
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
    									console.log("index should not be -1: " + index);
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
	return res.redirect('/profile');
})

//archive
app.get('/archive/:id', function(req, res) {
	var id = req.params.id;
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
		return res.redirect('/profile');
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
		return res.redirect('/profile');
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
					meetupArray.push(meetup);
				}
			next();
			}
		})
	}, function(err) {
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
					meetups: meetupArray,
					category: true
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
    				sortAlphabetically(friendArray);
    				sortAlphabetically(userarray);
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
		sortAlphabetically(friendArray);
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
		sortAlphabetically(friendArray);
		done(null, friendArray)
	});
}

app.get('/friendrequests', ensureAuthenticated, function(req, res) {
	var incomingfriendreqArray = [];
	var outgoingfriendreqArray = [];
	async.waterfall([
		function first(done) {
			getUserFriendRequests(req.user, incomingfriendreqArray, done);
		},
		function second(incomingfriendreqArray, done) {
			incomingfriendreqArray = incomingfriendreqArray;
			done(null, incomingfriendreqArray)
		},
		function third(incomingfriendreqArray, done) {
			//find all users
			User.find(function (err, arrayOfUsers) {
    			if (err) {
    				console.log('cannot find users');
    			} else {
    				arrayOfUsers.forEach(function (user) { 
    				//find  
    					var index = -1;
						user.friendrequests.some(function(obj, idx){
							if (obj._id.toString() === req.user.id.toString()) {
								index = idx;
								return true;
							}
						});
						if (index > -1) {
    						outgoingfriendreqArray.push(user);
						}	
    				})
    					outgoingfriendreqArray = outgoingfriendreqArray;
    					sortAlphabetically(incomingfriendreqArray);
    					sortAlphabetically(outgoingfriendreqArray);
    					done(null, incomingfriendreqArray, outgoingfriendreqArray)
   			 	}
  			});

		},
		function fourth(incomingfriendreqArray, outgoingfriendreqArray, done) {
			 res.render('users', { 
    			title: 'Friend Requests',
    			incomingList : incomingfriendreqArray,
    			outgoingList : outgoingfriendreqArray,
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
  res.redirect('/friendrequests ');
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
  res.redirect('/users');
})

app.get('/removefriend/:id', function(req, res) {
	var thisid = req.user.id;
	var thatid = req.params.id;
	//remove friend from both users
	User.findById(thisid, function(err, user) {
		if (!err) {
			var index = -1;
			user.friendslist.some(function(obj, idx) {
				if (obj._id.toString() === thatid.toString()) {
					index = idx;
					return true;
				}
			});
			if (index > -1) {
				user.friendslist.splice(index, 1);
			}
			user.save();

		} else {
			console.log(err);
		}
	});
	User.findById(thatid, function(err, user) {
		if (!err) {

			var index = -1;
			user.friendslist.some(function(obj, idx) {
				if (obj._id.toString() === thisid.toString()) {
					index = idx;
					return true;
				}
			});
			if (index > -1) {
				user.friendslist.splice(index, 1);
			}
			user.save();
		} else {
			console.log(err);
		}
	});
  res.redirect('/users');
})

//view my profile
app.get('/profile', ensureAuthenticated, function(req, res) {
	var id = req.user.id;
	User.findOne({
		_id: id
	}, function(err, user) {
		renderUserMeetupsCalendar(req.user, user, res, 'profile', 'Upcoming', true, true);
		//renderUserMeetups(req.user, user, res, 'profile', user.name, true);
	});
})

//upload profile pic
app.post('/upload/:id', upload.single('imgUploader'), function(req, res) {
	var id = req.params.id;
	if (req.file) {
		User.findById(id, function(err, user){
			user.profilepic = req.file.filename, 
			user.save(function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log('saved');
				}
			});
			renderUserMeetupsCalendar(req.user, user, res, 'profile', user.name, true, true);
		})
	} else {
		console.log("no file selected");
	}
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
				renderUserMeetupsCalendar(req.user, user, res, 'profile', 'Upcoming', true, false);
			} else {
				var userequals = false;
				if (user.id.toString() == req.user.id.toString()){
					userequals = true;
					res.redirect('/profile');
				} else {
					res.render('profile', {
						userid: id,
						requestlink: "/requestfriend/" + id,
						user: req.user,
						userview: user,
						friends: false,
						userequals: userequals
					});
				}
			}
		} else {
			console.log(err);
		}
	});
})


app.get('/deleteuser/:id', function(req, res) {
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
    			var index = -1;
				user.friendslist.some(function(obj, idx){
					if (obj._id.toString() === req.params.id.toString()) {
						index = idx;
						return true;
					}
				})
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