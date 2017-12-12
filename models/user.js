var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

//user schema

var User = mongoose.Schema({
	username: {
		type: String,
	},
	password: {
		type: String
	},
	email: {
		type: String
	},
	name: {
		type: String
	},
	profilepic: {
		type: String
	},
	meetupslist: [{
    	type: String
	}],
	friendslist: [{
		friendid: String
	}],
	friendrequests: [{
		friendid: String
	}],
});

var User = module.exports = mongoose.model('User', User);

module.exports.createUser = function(newUser, callback){
	//hash password with bcrypt
	bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(newUser.password, salt, function(err, hash) {
        	// Store hash in your password DB. 
        	newUser.password = hash;
        	newUser.save(callback);
   		 });
	});
}

module.exports.getUserByUsername = function(username, callback) {
	var query = {username: username};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback) {
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
		// Load hash from your password DB. 
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
	    if(err) throw err;
	    callback(null, isMatch);
	});
	
}