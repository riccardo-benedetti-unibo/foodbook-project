// app/models/rating.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ratingSchema = Schema({
	_id				: String,
	rate			: Number
});

module.exports = mongoose.model('Rating', ratingSchema);