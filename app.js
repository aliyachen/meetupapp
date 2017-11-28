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
var Schema = mongoose.Schema;

// var MongoClient = require('mongodb').MongoClient;
// var db = null;
// MongoClient.connect('mongodb://chenali:ac12345@ds159235.mlab.com:59235/aliya', (err, database) => {
// 	if (err) return console.log(err)
// 	db = database
// 	app.listen(3000, () => {
// 		console.log('listening on 3000')
// 	})
// })

mongoose.connect('mongodb://localhost/meetupapp');
var db = mongoose.connection;

//var routes = require('./routes/index');
var users = require('./routes/users');
// var meetups = require('./routes/meetups');

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



//model

//photo schema
// var Photo = new Schema(
// 	{ img: 
// 		{ data: Buffer, contentType: String}
// 	}
// );
var Meetup = mongoose.model('Meetup', {
	meetupName: {
		type: String,
		required:true
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

//addimage
app.get('/addimage/:id/', ensureAuthenticated, function (req, res) {
	Meetup.find(function(err, arrayOfMeetups){
		res.render('addimage', { 
			meetups: arrayOfMeetups,
			user: req.user
		});
	});
	
});



//read
app.get('/', function(req, res) {
	var query = { status: 'current' };
	Meetup.find(query, function(err, arrayOfMeetups) {
		console.log(arrayOfMeetups.length);
		 arrayOfMeetups.sort (function (a, b) {

    console.log(JSON.stringify(a.startdate));
    console.log(JSON.stringify(a.meetupName));
    console.log(a.status);
    //      var aComps = (a.startdate).split("/");
    // var bComps = (b.startdate).split("/");
    // var aDate = new Date(aComps[2], aComps[1], aComps[0]);
    // var bDate = new Date(bComps[2], bComps[1], bComps[0]);
    // return aDate.getTime() - bDate.getTime();
});
		res.render('index', {
			user: req.user,
			meetups: arrayOfMeetups
		});
	});
});


app.get('/catchup', ensureAuthenticated, function(req, res) {
	var query = { type: 'Catch-up', status: 'current' };
	Meetup.find(query, function(err, arrayOfMeetups) {
		res.render('category', {
			title: 'Catch-ups',
			user: req.user,
			meetups: arrayOfMeetups
		});
	});
});



//get image gallery
app.get('/gallery', ensureAuthenticated, function (req, res) {

	Meetup.find(function(err, arrayOfMeetups){
		res.render('gallery', { 
			meetups: arrayOfMeetups,
			user: req.user
		});
	});
	
});


//get calendar
app.get('/calendar', ensureAuthenticated, function (req, res) {
	Meetup.find(function(err, arrayOfMeetups){
	var meetupArray = arrayOfMeetups;
    var events = [];
    meetupArray.forEach(function(e) {
		var startstr = e.startdate;
 		var startmonth = startstr.slice(0, 2);
    	var startday = startstr.slice(3, 5);
    	var startyear = startstr.slice(6, 10);
    	var starthour = startstr.slice(11, 13);
    	var startmin = startstr.slice(14, 16);
    	var startdate = startyear + "-" +  startmonth + "-" + startday + " " + starthour + ":" + startmin + ":00";
    	startdate = (moment(startdate).unix() )*1000;
    	console.log(startdate);

		var endstr = e.startdate;
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

		res.render('calendar', { 
			meetups: arrayOfMeetups,
			user: req.user,
			events: events
		});
	});
	
});



//create amd update
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
		participants: req.body.participants,
		type: req.body.type,
		startdate: req.body.startdate,
		enddate: req.body.enddate,
		location: req.body.location,
		notes: req.body.notes,
		status: req.body.status
	}).save(function(err){
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
		res.render('edit', {
			meetups: doc
		});
	});
})




app.post('/update/:id', upload.single('imgUploader'), function(req, res) {
	console.log("Reached")
	console.log(req.file)
	var id = req.params.id;
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
				console.log("why");
				console.log(err);
			} else {
				console.log("ok why working");
			}
		});
		return res.redirect('/');
	});

		// return res.redirect('view', {
		// 	meetupid: id
		// })
})

//delete
app.get('/delete/:id', function(req, res) {
	Meetup.findById(req.params.id, function(err, meetup) {
		if (!err) {
			meetup.remove();
		} else {
			return err
		}
	});
	return res.redirect('/');
})

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
		return res.redirect('/');
	});
})


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
		return res.redirect('/');
	});
})


//catch-up meetups
app.get('/catchup', ensureAuthenticated, function(req, res) {
	var query = { type: 'Catch-up', status: 'current' };
	Meetup.find(query, function(err, arrayOfMeetups) {
		res.render('category', {
			title: 'Catch-ups',
			user: req.user,
			meetups: arrayOfMeetups
		});
	});
});

//study date meetups
app.get('/studydate', ensureAuthenticated, function(req, res) {
	var query = { type: 'Study Date', status: 'current'  };
	Meetup.find(query, function(err, arrayOfMeetups) {
		res.render('category', {
			title: 'Study Dates',
			user: req.user,
			meetups: arrayOfMeetups
		});
	});
});

//business meetings meetups
app.get('/businessmeeting', ensureAuthenticated, function(req, res) {
	var query = { type: 'businessmeeting', status: 'current'  };
	Meetup.find(query, function(err, arrayOfMeetups) {
		res.render('category', {
			title: 'Business Meetings',
			user: req.user,
			meetups: arrayOfMeetups
		});
	});
});

//club meeting meetups
app.get('/clubmeeting', ensureAuthenticated, function(req, res) {
	var query = { type: 'Club Meeting', status: 'current'  };
	Meetup.find(query, function(err, arrayOfMeetups) {
		res.render('category', {
			title: 'Club Meetings',
			user: req.user,
			meetups: arrayOfMeetups
		});
	});
});

//party meetups
app.get('/party', ensureAuthenticated, function(req, res) {
	var query = { type: 'Party', status: 'current'  };
	Meetup.find(query, function(err, arrayOfMeetups) {
		res.render('category', {
			title: 'Parties',
			user: req.user,
			meetups: arrayOfMeetups
		});
	});
});

//miscellaneous meetups
app.get('/other', ensureAuthenticated, function(req, res) {
	var query = { type: 'Other', status: 'current'  };
	Meetup.find(query, function(err, arrayOfMeetups) {
		res.render('category', {
			title: 'Other Meetups',
			user: req.user,
			meetups: arrayOfMeetups
		});
	});
});

//archived meetups
app.get('/archive', ensureAuthenticated, function(req, res) {
	var query = { status: 'past' };
	Meetup.find(query, function(err, arrayOfMeetups) {
		res.render('archive', {
			title: 'Past Meetups',
			user: req.user,
			meetups: arrayOfMeetups
		});
	});
});


//start


app.listen(app.get('port'), function() {
	console.log('Server started on port '+app.get('port'));
});