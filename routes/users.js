var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var async = require('async');
//register
router.get('/register', function(req, res) {
	res.render('register', {
		register: true
	});
});

//login
router.get('/login', function(req, res) {
	res.render('login');

});


//register user
router.post('/register', function(req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	//validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  var query = {username: username};
	var userlength = 0;
	async.waterfall([
		function first(done) {
			req.getValidationResult().then(function(result){
				validationerrors = true;
					console.log(result.array());
				if (result.array() != '') {
					console.log("result is not empty")
					validationerrors = true;
					var errors = result.array().map(function (elem) {
						return elem.msg;
					})
					console.log("errors: " + errors.join('&&'));
					var errormessage = errors.join('&&');
					console.log('WHAT IS ERROR MESSAGE: ' + errormessage);
					res.render('register',{
						errors: errors
					})
					done(null, true);
				} else {
					done(null, false);
				}
  			 });
		},
		function second(validationerrors, done) {
			console.log("validationerrors should be true" + validationerrors);
			if (!validationerrors) {

				User.find(query, function (err, user) {
					console.log("what is uer: " + user);
					userlength = user.length;
					console.log("user length: " + userlength);
					done(null, userlength);
				});	

			} 
			else {
				done(null, -1);
			}
		},
		function third(userlength, done) {
			console.log("beter not be here");
			var usernameexists = false;
			if (userlength == -1) {
				usernameexists = true;
				done(null, usernameexists)
			}
			else if (userlength > 0) {
				usernameexists = true;
				res.render('register',{
					errmessage: 'Username already taken. Please try again!'
				})
			}; 
			done(null, usernameexists)
		},
		function fourth(usernameexists, done) {
			console.log("username exists should be false" + usernameexists);
			if (!usernameexists) {
				var newUser = new User({
					name: name,
					email: email,
					username: username,
					password: password
				});

				User.createUser(newUser, function(err, user){
					if(err) throw err;
					console.log(user);
				});

				req.flash('success_msg', 'You are registered and can now login!');
				res.redirect('/users/login#loginpage');
			}
			done(null)
		}
	], function (err) {
		if (err) {
			console.log(err);
		}
	});


	// var query = {username: username};
	// var userlength = 0;
	// User.find(query, function (err, user) {
	// 	console.log("what is uer: " + user);
	// 	userlength = user.length;
	// });

	// console.log("userlength : " + userlength); 
	// if (userlength != 0) {
	// 	res.render('register',{
	// 		errmessage: "Username already taken"
	// 	})
	// }  else {
	// 	var newUser = new User({
	// 		name: name,
	// 		email: email,
	// 		username: username,
	// 		password: password
	// 	});

	// 	User.createUser(newUser, function(err, user){
	// 		if(err) throw err;
	// 		console.log(user);
	// 	});

	// 	req.flash('success_msg', 'You are registered and can now login!');
	// 	res.redirect('/users/login');
	// }
});

passport.use(new LocalStrategy(
  function(username, password, done) {
  	User.getUserByUsername(username, function(err, user){
  		if(err) throw err;
  		if(!user){
  			return done(null, false, {message: 'Unknown User'});
  		}

  		User.comparePassword(password, user.password, function(err, isMatch) {
  			if(err) throw err;
  			if(isMatch) {
  				return done(null, user);
  			} else {
  				return done(null, false, {message: 'Invalid password'});
  			}
  	});
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', {successRedirect: '/profile', failureRedirect: '/users/login', faliureFlash: true}),
  function(req, res) {
    res.redirect('/profile'); //redirect to dashboard
  });

router.get('/logout', function(req, res) {
	req.logout();
	req.flash('success_msg', 'You are logged out');
	res.redirect('/users/login');
})


module.exports = router;