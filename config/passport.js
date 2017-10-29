// config/passport.js

var LocalStrategy = require('passport-local').Strategy;
var db = require('../db');

var bcrypt   = require('bcrypt-nodejs');
const generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
const validPassword = function(password1, password2) {
    return bcrypt.compareSync(password1, password2);
};

module.exports = function(passport) {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.user_id);
    });
    // used to deserialize the user
    passport.deserializeUser(function(id, done){
        if(empty(id))
            return done(err,null);

        db('users').where({user_id:id}).first()
            .then((user) => {
                if(empty(user))
                    return done(null, null)
                else done(null, user); })
            .catch((err) => { done(err,null); });
    });
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {
            // asynchronous User.findOne wont fire unless data is sent back
            process.nextTick(function() {
                db('users').where({email:email, nationalid: req.body.nationalid}).then((user)=>{
                    if (!empty(user)) {
                        return done(null, false, {message: 'userfound' });
                    } else {

                        for(var q in req['body']){
                            if(req['body'].hasOwnProperty(q))
                                if(empty(req['body'][q]))
                                    delete req['body'][q];
                        }

                        if(req['body']['password']){
                            req['body']['password'] = generateHash(req['body']['password']);
                            req['body']['pin'] = req['body']['password']
                            delete req['body']['password'];
                        }
                        return db('users').insert(req['body']).then(()=>{
                                return db('users').where({email:req['body']['email']})
                                    .first().then((user)=>{
                                        return done(null, user);
                                    }).catch((err) => done(null, false, {message: 'erroruserfields' }))
                            })
                            .catch((err) => {
                                console.log(err);
                                done(null, false, {message: 'erroruserfields' })
                            })
                    }
                }).catch((err)=> {
                    console.log(err);
                    done(err)
                });
            })
        }));
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            console.log('do we come here' , email , password)
            db('users')
                .where({'email' :  email }).then(function( user) {
                // if no user is found, return the message
                console.log('User', user);


                if (empty(user))
                    return done(null, false, {message:'nouser'}); // req.flash is the way to set flashdata using connect-flash
                // if the user is found but the password is wrong
                if (!validPassword(password, user[0].pin))
                    return done(null, false, {message:'nopass'}); // create the loginMessage and save it to session as flashdata
                // all is well, return successful user
                return done(null, user[0]);

            }).catch((err)=>done(err));

        }));

};
