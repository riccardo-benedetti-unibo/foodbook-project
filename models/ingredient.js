// app/models/ingredient.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ingredientSchema = Schema({
	_id				: Number,
	name		    : String,
	amount			: Number,
	unitLong		: String
});

module.exports = mongoose.model('Ingredient', ingredientSchema);