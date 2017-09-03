//load up the recipe model
var Recipe = require('../models/recipe');
var Rating = require('../models/rating');
var mongoose = require('mongoose');
var configDB = require('../database/database.js');

mongoose.connection.openUri(configDB.url);

var c = 0;
var m = 1;
Recipe.find({}, {}, {}, function (err, recipes) {
    if(err){
        throw err;
    }else{
        var n = 0;
        for(var i=0; i < recipes.length; i++){
            for(var j=0; j < recipes[i].ratings.length; j++){
                if(recipes[i].ratings[j].rate){
                    c += recipes[i].ratings[j].rate;
                    n++;
                }
            }
        }

        c/=n;

        for(var i=0; i < recipes.length; i++){
            var v = recipes[i].ratings.length;
            var R = 0;

            for(var j=0; j < v; j++){
                R+=recipes[i].ratings[j].rate;
            }

            if(v > 0){
                R /= v;
                var bayesian = (v / (v + m)) * R + (m / (v + m)) * c;
                recipes[i].bayesianRating = bayesian;
            }else{
                recipes[i].bayesianRating = 0;
            }

            recipes[i].save(function (err) {
                if(err){
                    throw err;
                }
            });
        }
    }
});



/*stream.on('data', function (recipe) {
    var v = recipe.ratings.count();

    if(v>0){
        var R = 0, m = 1;

        recipe.bayesianRating = recipe.ratings.forEach(function (rating) {
            R += rating;
        }).then(function () {
            R /= v;
        });
    }
}).on('error', function (err) {
    mongoose.connection.close();
    throw err;
});*/