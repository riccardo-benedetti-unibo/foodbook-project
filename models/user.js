// app/models/user.js
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// load up the user model
var userSchema = new mongoose.Schema({
	_id          : String, /* user email */
	local : {
		password     : String,
		name         : String,
    	gender       : String,
    	birthyear     : String,
    	nationality  : String
    },
	facebook : {
		name         : String,
    	gender       : String,
    	birthyear     : String,
    	nationality  : String
    },
    cookbook 	: [Number]
});


// checking if password is valid using bcrypt
userSchema.methods.validPassword = function(password) {
	if(this.local.password)
		return bcrypt.compareSync(password, this.local.password);
	else
		return false;
};

//generating a hash
userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//check recipe in cookbook
userSchema.methods.cookbookContains = function(recipeid) {
	var found = false;
	for(var i = 0; i < this.cookbook.length; i++) {
	    if (this.cookbook[i] == recipeid) {
	        found = true;
	        break;
	    }
	};
	return found;
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);