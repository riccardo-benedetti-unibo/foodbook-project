// app/models/recipe.js
var mongoose = require('mongoose');
var configDB = require('../database/database.js');

var Rating = require('./rating');

var recipeSchema = new mongoose.Schema({
	_id     		: Number,
	title   		: String,
	readyInMinutes	: Number,
	image			: String,
	instructions	: String,
	ingredients 	: ['Ingredient'],
	ratings			: ['Rating'],
	bayesianRating  : Number,
	likes			: Number
});

recipeSchema.methods.getUpdatedAvgRating = function(userid,userrate) {
	var avgRating = "no";
	var userexist = false;
	if(this.ratings.length==0 && userid){
		return userrate;
	}else if(this.ratings.length>0){
		avgRating = 0;
		for(var i=0; i<this.ratings.length; i++){
			if(this.ratings[i]._id != userid){
				avgRating = avgRating + this.ratings[i].rate;
			}else{
				userexist = true;
			}
		}
		if(userexist){
			avgRating = avgRating + parseInt(userrate);
		}
		avgRating /= this.ratings.length;
	}
	return avgRating;
}

/*recipeSchema.methods.getBayesianEstimate = function() {
    var ba = 0;
    if(this.ratings.length>0){
        var v = this.ratings.length;
        var R = this.getUpdatedAvgRating();
        var m = 1;
        var C = recipeSchema.collection.find({},function (recs) {
			recs.forEach(function (rec) {
				return rec.getUpdatedAvgRating() + C;
            });
        }) / recipeSchema.count;

        ba = (v / (v+m)) * R + (m / (v+m)) * C
    }
    return ba;
}*/

recipeSchema.methods.getUserRate = function(userid) {
	for(var i=0; i<this.ratings.length; i++){
		if(this.ratings[i]._id == userid){
			return this.ratings[i].rate;
		}
	}
	return false;
}

module.exports  = mongoose.model('Recipe', recipeSchema);