// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;


// load up the user model
var User       = require('../app/controllers/user.js');

// load the auth variables
//var configAuth = require('./auth'); // use this one for testing

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
			done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {

        // asynchronous
        process.nextTick(function() {
            User.findOne(email, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false);

                if (!user.validPassword(password))
                    return done(null, false);

                // all is well, return user
                else
                    return done(null, user);
            });
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {

        var newUser = new User(email);
        if(!newUser.validate(email))
            return done("Invalid characters in username!", false, {message:"Invalid characters"});
        console.log(email);

        // asynchronous
        process.nextTick(function() {

            User.findOne(email, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if theres already a user with that email
                if (user) {
                    console.log("That username is already taken!");
                    return done(null, false, {message: "That username is already taken!"});
                } else {

                    // create the user
                    
                    newUser.setPassword(password);
                    newUser.save(function(err) {
                        if (err)
                            return done(err, false, {message:"Error in registration"});

                        console.log("signin up");
                        console.log(newUser);
                        return done(null, newUser);
                    });
                }
            });
        });
    }));

};
