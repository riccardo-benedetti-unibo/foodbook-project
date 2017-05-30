// app.js

// set up ======================================================================
// get all the tools we need
var fs = require('fs');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var flash    = require('connect-flash');

var app      = express();

/*-----------------------------------------------------------------*/

app.set('view engine', 'ejs'); // set up ejs for templating

/*-------------------------------------------------------------------*/

require('./middleware/passport')(passport); // pass passport for configuration

//parse application/json
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(logger('dev'));

// required for session
app.use(session({ secret: "keyboard cat",
    proxy: true,
    resave: true,
    saveUninitialized: true })); // session secret

// required for passport
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

//Initialize the app.
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    fs.readFile(__dirname + '/public/ejs/index.ejs', 'utf8', function(err, text){
        res.send(text);
    });
});
app.listen(process.env.PORT || 5000);