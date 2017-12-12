var mongoose = require('mongoose');

var Meetup = mongoose.Schema({
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


var Meetup = module.exports = mongoose.model('Meetup', Meetup);