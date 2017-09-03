//load up the recipe model
var Recipe = require('../models/recipe');
var Rating = require('../models/rating');
var mongoose = require('mongoose');
var configDB = require('../database/database.js');

mongoose.connection.openUri(configDB.url);

var c = 0;

Recipe.find({}, {}, {}, function (err, recipe) {
    if(err){
        throw err;
    }else{
        recipe.ratings.forEach(function (err, rating){
            if(err) {
                throw err;
            }else{
                c += rating['rate'];
            }
        });
    }
}).then(function () {
    console.log(c);
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

mongoose.connection.close();