const express = require('express');
const router = express.Router();
const passport = require('passport');
const auth = require('../mw/auth');
const users = require('../mw/mw-users');
const devices = require('../mw/mw-devices');
const validations = require('../mw/mw-validations');
const users_devices = require('../mw/mw-users_devices');

router.get('/', function(req, res, next){
  res.json({message: "welcome to BRANTU Accounts Api"});
});
router.post('/find',
           users.find,
           function(req, res, next){
             res.json({found: (req.data.user)});
           });

router.get('/logout',function(req, res, next) {
    req.logout();
    res.status(200).json({logout:true});
});
router.post('/logout',function(req, res, next) {
    req.logout();
    res.status(200).json({logout:true});
});


router.post('/get',
            users.find,
            function(req, res, next){
                res.json({user: req.data.user});
            });

router.get('/auth-token',
           (req,res,next)=>{req.query.minify_info =true; return next()},
           users.get_connected_devices,
           validations.get_user_validation_status,
           users.minify_info,
           function(req, res, next){
             if(req.user){
               const token = auth.create(req.user)
               return res.json({
                                valid: true ,
                                user: req.data.minified_user,
                                jwt: token
                               });
             }
             else
               return res.json({message: 'usernotfound', valid:false});
           });


router.post('/auth',
            function(req, res, next){
              passport.authenticate('local-login',function(err, user, info){
                if (err) {return next(err)}
                if (!user) {
                  return res.json({message: 'error'});
                }
                else
                  return req.logIn(user, function(err) {
                    return res.redirect('/users/auth-token');
                  });
              })(req, res, next)
            });

router.post('/register',
            (req,res,next)=>{
                req.data.device = req.body.device;
                req.data.device_id = req.body.device_id;
                delete req.body.device;
                return next();
            },
            function(req, res, next){
              passport.authenticate('local-signup',
                (err, user, info) => {
                  if (err || !user) {
                    return next(err || new Error('User Found'))
                  }
                  else{
                    req.data.user = user;
                    return next();}
                })(req, res, next)
            },
            devices.register,
            users_devices.disconnect_device,
            users_devices.create_connection,
            validations.initialize,
            users.refresh_state,
            devices.refresh_state,
            (req,res,next)=>{
                req.logIn(req.data.user, function(err) {
                    res.redirect('/users/auth-token');
                })
            });


router.get('/verify/:token',
           users.verifyToken,
           users.find,
           users.logIn,
           users.get_connected_devices,
           validations.get_user_validation_status,
           users.minify_info,
           function(req,res,next){
             if(req.data.user)
               //jwt: auth.create(req.data.user)
               return res.json({
                                 user: req.data.minified_user,
                                 jwt:  req.params.token,
                                 valid:true
                               });
             else
               return res.json({valid:false});
           });
module.exports = router;
