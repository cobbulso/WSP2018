// passport is also imported at app.js
// the configuration made at app.js is available here too
// do not configure it again
const passport = require('passport');
const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;


// how to serialize user to store in session
passport.serializeUser((user, callback) => {
    callback(null, user._id);
});

// how to deserailize user from serialized data (user)
passport.deserializeUser((id, callback) => {
    User.findById(id, (err, user) => {
        callback(err, user);
    })
});

const localStrategyConfig = {
    roleField: 'rold',
    firstNameField: 'firstName',
    lastNameField: 'lastName',
    usernameField: 'email',
    passwordField: 'password',
    streetAddressField: 'streetAddress',
    cityField: 'city',
    stateField: 'state',
    zipCodeField: 'zipCode',
    favoriteFoodField: 'favoriteFood',
    verifyField: 'verify',
    passReqToCallback: true // pass the eniter request to the callback
}

passport.use('localsignup',
    new LocalStrategy(localStrategyConfig, (req, email, password, callback) => {
        User.findOne({'email': req.body.email}, (err, user) => {
            if (err) return callback(null, false, req.flash('signuperror', err));
            if (user) return callback(null, false, req.flash('signuperror','Email is already in use'));

            const newUser = new User();
            newUser.role = req.body.role;
            newUser.firstName = req.body.firstName;
            newUser.lastName = req.body.lastName;
            newUser.email = email;
            newUser.streetAddress = req.body.streetAddress;
            newUser.city = req.body.city;
            newUser.state = req.body.state;
            newUser.zipCode = req.body.zipCode;
            newUser.favoriteFood = req.body.favoriteFood;
            newUser.verify = Math.floor((Math.random() * 100) + 54);
            newUser.encryptPassword(req.body.password, (err, result) => {
                if (err) return callback(null, false, req.flash('signuperror', err));
                newUser.password = result;
                newUser.save((err, result) => {
                    if (err) return callback(err);
                    return callback(null, newUser, req.flash('signupsuccess', 'Sign up successful! Login, please!'));
                });
            });
        });
    })
);

passport.use('locallogin',
    new LocalStrategy(localStrategyConfig, (req, email, password, callback) => {
        User.findOne({'email': email}, (err, user) => {
            if (err) return callback(null, false, req.flash('loginerror', err));
            if (!user) return callback(null, false, req.flash('loginerror', 'Invalid email'));
            user.verifyPassword(password, (err, result) => {
                if (err) return callback(null, false, req.flash('loginerror', err)); 
                if (!result) return callback(null, false, req.flash('loginerror', 'Incorrect password'));
                return callback(null, user);
            });
        });
    })
);