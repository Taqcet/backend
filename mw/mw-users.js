var db = require('../db');
var auth = require('./auth');
var bcrypt   = require('bcrypt-nodejs');
const accounts = {
  find:function(req,res,next){
    const user_id = req.body.user_id || req.query.user_id || null;
    const email = req.body.email || req.query.email || null;
    const nationalid = req.body.nationalid || req.query.nationalid || null;
    var condition =  (!empty(user_id)? {user_id:user_id}: !empty(email)? {user_email:email}
                    :nationalid?{nationalid:nationalid}:null);

    if(empty(condition))
      return next();


    db('users').where(condition).first().then((user)=>{
        req.data.user = empty(user)? null:user;
         next(); return null;
    }).catch((err)=> next(err));
  },
  logIn:function(req,res,next){
      if(req.data.user && empty(req.user)){
        return req.logIn(req.data.user, function(err) {
          return next();
        });
      }
      else{
        return next();
      }
  },
  verifyToken:function(req,res,next){
    var token = req.params.token || req.body.token || req.query.token;
    if (!token) {
      return res.status(401).json({message: "Must pass token"});
    }
    else{
      auth.verify(token,function(err, object){
        if(err){
          res.status(401);
          return next(err);
        }
        else {
          req.body = Object.assign(req.body, object);
          return next();
        }
      });
    }
  },
  get_connected_devices:(req,res,next)=>{
    const user = req.user || req.data.user;
    var user_id = req.data.user_id || req.query.user_id;
      if(empty(user_id)&&empty(user)){
        return next();
      }
    if(empty(user_id) && !empty(user))
      user_id = user.user_id



    //.select(select)

    db('users_to_devices')
    .whereRaw(`users_to_devices.user_id = ${user_id} AND users_to_devices.user_to_device_state = 1`)
    .leftJoin('devices','users_to_devices.device_id','devices.device_id')
    .leftJoin('validations','users_to_devices.user_to_device_id','validations.user_to_device_id')
    .then(devices=>{
      if(req.user)
        req.user.connected_devices = devices;
      req.data.connected_devices = devices;
      return next();
    })
    .catch(err=>{
      console.log(err);
      next()
    })

  },
  refresh_state:(req,res,next)=>{
    const user_id = req.data.user_id || req.body.user_id || req.query.user_id;
    console.log('refreshing state', user_id)
    if(empty(user_id))
      return next();
    db('users_to_devices')
        .where({user_id:user_id, user_to_device_state:1})
        .then(d=>{
          var state = empty(d)?0:1;
          return db('users').where({user_id:user_id}).update({user_state:state})
        })
        .then(s=>{
          return next();
        })
        .catch(err=>{
          console.log(err);
          return next(err)
        })
  },
  minify_info:(req,res,next)=>{
    const u = req.user;


    if(empty(u))
        return next();

    const s = u.connected_devices.map(t=>{
      return { device_id:t.device_id,
               device_state:t.device_state,
               device_type:t.device_type,
               device_unique_id:t.device_unique_id,
               validation_id:t.validation_id,
               validation_state:t.validation_state,
               user_to_device_state:t.user_to_device_state,
               user_to_device_id:t.user_to_device_id};
    });

    req.data.minified_user = {
      user_id:u.user_id,
      user_state:u.user_state,
      user_validated: u.user_validated,
      user_verified:u.user_verified,
      user_connected_devices: s,
      first_name:u.first_name,
      last_name:u.last_name,
      email:u.email,
    };

    return next();
  },
  check_pin:(req,res,next)=>{
    const letsReturn = (err, valid) =>{
      if(empty(next)){
        if(err)
          return res(err)
        else
          return res(null, valid);
      }
      else{
        if(err)
          return next(err);
        else{
          req.data.valid = req.valid = valid;
          return next()
        }
      }
    };

    console.log('mmmm', req)

    db('users')
        .where({user_id: req.user.user_id})
        .first()
    .then(user =>{
      console.log(user);
      if(empty(user))
        return letsReturn(new Error('User Not found'))
      else{
        return letsReturn(null, bcrypt.compareSync(req.pin, user.pin));
      }
    });
  },
}
module.exports = accounts;
