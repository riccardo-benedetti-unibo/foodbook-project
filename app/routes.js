// app/routes.js

var mongoose = require('mongoose');
var configDB = require('../database/database.js');

module.exports = function(app, passport) {
	
	// ==========================================================
	// ENTRY ROUTE ==============================================
	// - mainpage route (if user is already logged in) ==========
	// - index page (if user is NOT already logged in) ==========
	// ==========================================================
	app.get('/', function(req, res) {
        if(mongoose.connection.readyState==0){ // check if db is disconnected
            mongoose.connect(configDB.url,{ server: { poolSize: 5 } }, function (err) {
                if(err){
                	throw err;
                } else {
                	console.log('Successfully connected to url: '+ configDB.url);
                }
            }); // connect to the database
        }
		if(req.session.email) { // check user session existence
			res.redirect('/mainpage'); // redirect to the mainpage route
		}else {
            res.render('../public/ejs/index.ejs'); // load the index.ejs file
		}
	});


    // ==========================================================
	// MAIN PAGE ROUTE ==========================================
	// get 15 random recipes and show them on the mainpage ======
    // ==========================================================
    app.get('/mainpage', function(req, res) {
    	var Recipe = require('../models/recipe'); // load Recipe model
        var conditions = [{}];
		if(req.param('keywords')){
			conditions = [];
            var keywords = req.param('keywords').split(" "); // get the entire string and split the ingredient words
            keywords.forEach(function (keyword) {
                conditions.push({ "ingredients.name" : { "$regex" : keyword, "$options": "i" }}); // build the a query condition for each word
            });
		}
		var page = 1;
		if(req.param('page')){
			page = parseInt(req.param('page'));
		}
		Recipe.find({"$and" : conditions }, {}, {}).count(function(err, count){
			if(err){
				throw err;
			}else{
                Recipe.find({"$and" : conditions }, {}, {skip: (page-1)*20, limit:20}, function(err, results){
                    if (err) {
                        throw err;
                    } else {
                        res.render('../public/ejs/mainpage.ejs', {
                            userId : req.session.email,
                            user : req.session.name,
                            recipes : results,
                            currentpage : page,
                            npages : Math.floor((count-1)/20)+1,
							keywords : req.param('keywords')
                        }); // load the mainpage.ejs file
                    }
                });
			}
        });
    });

    // ==========================================================
	// COOKBOOK PAGE ROUTE ======================================
    // check for user session and load his cookbook =============
    // ==========================================================
    app.get('/cookbook', function(req, res) {
    	if(req.session.email){ // check user session existence
            var Recipe = require('../models/recipe');
            var User = require('../models/user');
            var page = 1;
            if(req.param('page')){
                page = parseInt(req.param('page'));
            }
    		User.findById(req.session.email, function (err, user){ // get the logged user from db
        		Recipe.find({ '_id': {$in: user.cookbook} }, {}, {skip: (page-1)*20, limit:20}, function(err, results){ // get the all the recipes from the user cookbook
        			res.render('../public/ejs/cookbook.ejs', {
                        userId : req.session.email,
        				user : req.session.name,
                        recipes : results,
                        currentpage : page,
                        npages : Math.floor((user.cookbook.length)/20)+1
        			}); // load the cookbook.ejs file
        		});
        	});
    	}else {
    		res.render('index.ejs'); // load the index.ejs file
    	}
    });

    // ==========================================================
    // RECIPE DETAIL PAGE ROUTE =================================
    // display recipe detail page ===============================
    // ==========================================================
	app.post('/recipe', function(req, res){
		var Recipe = require('../models/recipe');
		Recipe.findById(req.body.recipeid, function (err, recipe){ // get the clicked recipe from db
			if (req.session.email) {
				var User = require('../models/user');
				User.findById(req.session.email, function (err, user){ //
					if (err) {
						throw err;
                    } else {
                        res.render('../public/ejs/recipe.ejs', {
                            user : req.session.name,
                            recipe : recipe,
                            likestate : user.cookbookContains(req.body.recipeid), // check if this recipe is already into the user cookbook to set the like button
                            avgRating : recipe.getUpdatedAvgRating(), // get the recipe average rating
                            userRate : recipe.getUserRate(req.session.email) // check if the user has already voted the recipe to set the stars lighting
                        });
					}
			    });
			} else {
				res.render('../public/ejs/recipe.ejs', {
					user : '',
		    		recipe : recipe,
					likestate : false,
		    		avgRating : recipe.getUpdatedAvgRating(),
					userRate : false
				});
			}
		});
	});

    // ==========================================================
    // LIKE RECIPE ROUTE ========================================
    // add the recipe to the current user cookbook ==============
    // ==========================================================
	app.post('/likerecipe', function(req, res){
		if(req.session.email){ 
			var User = require('../models/user');
			var Recipe = require('../models/recipe');
			User.findById(req.session.email, function(err, usr) {
                if (usr.cookbookContains(req.body.recipeid)) { // dislike recipe
                    User.update({_id: usr._id},
                        {$pull: {cookbook: req.body.recipeid}}, // remove recipe from user cookbook
                        {upsert: true}, function (err) {
                            if (err) {
                                throw err;
                            } else {
                                Recipe.findByIdAndUpdate({_id: req.body.recipeid}, {$inc: {likes: -1}}, function (err) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        res.end();
                                    }
                                }); // the recipe loses 1 like
                            }
                        });
                } else { // like recipe
                    User.update({_id: usr._id},
                        {$push: {cookbook: req.body.recipeid}},
                        {upsert: true}, function (err) {
                            if (err) {
                                throw err;
                            } else {
                                Recipe.findByIdAndUpdate({_id: req.body.recipeid}, {$inc: {likes: 1}}, function (err) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        res.end();
                                    }
                                }); // the recipe gains 1 like
                            }
                        }
					);
                }
            });
		}
	});

    // ==========================================================
    // RATE RECIPE ROUTE ========================================
    // add the recipe to the current user cookbook ==============
    // ==========================================================
	app.post('/raterecipe', function(req, res){
        var Recipe = require('../models/recipe');
        var User = require('../models/user');
		var Rating = require('../models/rating');
		var rating = new Rating();
		rating._id = req.session.email;
		rating.rate = req.body.star;
		Recipe.findById(req.body.recipeid, function(err, recipe){
			if (err) {
				throw err;
			} else {
                User.findById(req.session.email, function (err, user){
                    if (err) {
                        throw err;
                    } else {
                        Recipe.update({_id: req.body.recipeid}, {$pull: {ratings: {'_id': req.session.email}}}, function (err) {
                            if (err) {
                                throw err;
                            } else {
                                Recipe.update({_id: req.body.recipeid}, {$push: {'ratings': rating}}, function (err) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        res.render('../public/ejs/recipe.ejs', {
                                            user: req.session.name,
                                            recipe: recipe,
                                            likestate: user.cookbookContains(req.body.recipeid),
                                            avgRating: recipe.getUpdatedAvgRating(req.session.email, req.body.star),
                                            userRate: req.body.star
                                        });
                                    }
								});
                            }
						});
                    }
                });
			}
		});
	}); 
	
	
	// =====================================
	// ANALYTICS PAGE ROUTE =================
	// ======================================
    app.get('/analytics', function(req, res) {
    	var User = require('../models/user');
    	var Recipe = require('../models/recipe');
    	var recipeInCookbook = [];
    	var recipeRating = [];

        Recipe.find({}, {}, {sort:{likes: -1}, limit:10}, function(err, results){
            if (err) {
                throw err;
            } else {
            	var rin = [];
            	results.forEach(function (rec) {
					rin.push({"name" : rec.title, "added" : rec.likes });
                });
            	recipeInCookbook = rin;
            	doRender();
            }
        });

        Recipe.find({}, {}, {sort:{bayesianRate: -1}}).limit(10, function(err, results){
            if (err) {
                throw err;
            } else {
                var rr = [];
                results.forEach(function (rec) {
                    rr.push({"name" : rec.title, "rating" : rec.bayesianRating });
                });
                recipeRating = rr;
                doRender();
            }
        });
        
        function doRender() {
        	if(recipeInCookbook.length > 0 && recipeRating.length > 0){
                res.render('../public/ejs/analytics.ejs', {
                    user : req.session.name,
                    recipeInCookbook : recipeInCookbook,
                    recipeRating : recipeRating
                }); // load the analytics.ejs file
			}
        }
    });

    // ==========================================================
	// FACEBOOK AUTH ROUTE ======================================
    // route for facebook authentication ========================
    // ==========================================================
	app.get('/auth/facebook', passport.authenticate('facebook', { scope: [	'email', 'user_birthday', 'user_location'	]}));

	
	// ==========================================================
	// FACEBOOK CALLBACK HANDLER ROUTE ==========================
    // route for facebook callback ==============================
	// ==========================================================
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/savesession',
			failureRedirect : '/'
	}));

	// ==========================================================
	// SAVE SESSION ROUTE =======================================
    // route for savesession page ===============================
	// ==========================================================
	app.get('/savesession', function(req, res) {
        req.session.email = req.user._id;
		if(req.user.facebook.name){
            req.session.name = req.user.facebook.name;
		}else{
            req.session.name = req.user.local.name;
		}
		res.redirect('/mainpage');
	});
	
	// ===========================================================
	// SIGNIN PAGE ROUTE =========================================
    // route for signin page =====================================
	// ===========================================================
	app.get('/signin', function(req, res) {
		if (req.session.email) {
            res.redirect('/mainpage');
		} else {
            res.render('../public/ejs/signin.ejs', { message: req.flash('loginMessage') });
		}
	});

    // ===========================================================
    // SIGNIN OUTCOME ROUTE ======================================
    // route for signin page =====================================
    // ===========================================================
	app.post('/signin', passport.authenticate('local-login', {
		successRedirect : '/savesession', // redirect to the secure profile section
		failureRedirect : '/signin', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));


	// ===========================================================
	// REGISTER PAGE ROUTE =======================================
    // route for register page ===================================
	// ===========================================================
	app.get('/register', function(req, res) {
        if (req.session.email) {
            res.redirect('/mainpage');
        } else {
            res.render('../public/ejs/register.ejs', {message: req.flash('registerMessage')});
        }
	});

    // ===========================================================
    // REGISTER OUTCOME ROUTE ====================================
    // route for register page ===================================
    // ===========================================================
	app.post('/register', passport.authenticate('local-register', {
	    successRedirect: '/register',
	    failureRedirect: '/register',
	    failureFlash : true 
	}));
	
	
	// =====================================
	// LOGOUT ROUTE ========================
	// =====================================
	app.get('/logout', function(req, res) {
		req.session.destroy(function(err) { //reset user current session
			  if(err) {
				  console.log(err);
			  } else {
				  res.redirect('/'); //redirect to entry route
			  }
		});
	});
};
