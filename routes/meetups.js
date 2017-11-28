var express = require('express');
var router = express.Router();
var Meetup = require('../models/meetups');


router.get('/createMeetup', ensureAuthenticated, function (req, res) {
	res.render('createMeetup', { user: req.user });
});
router.get('/getAllMeetups', ensureAuthenticated, function (req, res, next) {
	Meetup.getAllMeetups(function (err, meetups) {
		if (err) {
			next(err);
		} else {
			res.json(meetups);
		}
	});
});
router.post('/createMeetup', function (req, res, next) {
	var meetupData = {
		meetupName: req.body.meetupName,
		type: req.body.type,
		date: req.body.date,
		location: req.body.location,
		notes: req.body.notes
	};
	Meetup.createMeetup(meetupData, function(err, meetups) {
		if (err) {
			next(err);
		} else {
			req.flash('success_msg', 'Meetup added!');
			//res.send('Meetup added');
			res.redirect('/meetups/getAllMeetups');
		}
	});
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg', 'You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;