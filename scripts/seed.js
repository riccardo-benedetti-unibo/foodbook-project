//These code snippets use an open-source library. http://unirest.io/nodejs
var unirest = require('unirest');
//load up the recipe model
var Recipe = require('../models/recipe');
var Ingredient = require('../models/ingredient');
var mongoose = require('mongoose');
var configDB = require('../database/database.js');

unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/random?limitLicense=false&number=1000")
    .header("X-Mashape-Key", "7pq9bPqK5Fmsh9lw9zP4A6vZDSpLp1iP4YejsnCEdM8PRQ3kyV")
    .header("Accept", "application/json")
    .end(function (result, error) {

    	mongoose.connect(configDB.url);

        var parsed = JSON.parse("" + JSON.stringify(result.body) + "");

        for (i = 0; i < parsed.recipes.length; i++) {
            var newRecipe = new Recipe();

            newRecipe._id = parsed.recipes[i].id;
            newRecipe.title = parsed.recipes[i].title;
            newRecipe.readyInMinutes = parsed.recipes[i].readyInMinutes;
            newRecipe.image = parsed.recipes[i].image;
            newRecipe.instructions = parsed.recipes[i].instructions;
            newRecipe.likes = 0;

            for (j = 0; j < parsed.recipes[i].extendedIngredients.length; j++) {
                var ingr = new Ingredient();

                ingr._id = parsed.recipes[i].extendedIngredients[j]._id;
                ingr.name = parsed.recipes[i].extendedIngredients[j].name;
                ingr.amount = parsed.recipes[i].extendedIngredients[j].amount;
                ingr.unitLong = parsed.recipes[i].extendedIngredients[j].unitLong;

                newRecipe.ingredients.push(ingr);
            }

            newRecipe.save();
        }
        mongoose.connection.close();
    });