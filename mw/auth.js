const jwt = require('jsonwebtoken');
const secrets = require('../config/secrets');
const mw = {
  authMW:function(req,res,next){
    var token = req.headers['authorization'];
    if (!token) return next();
    token = token.replace('Bearer ', '');
    mw.verify(token,function(err, user){
      if (err) {
        return res.status(401).json({
            success: false,
            message: 'Please register Log in using a valid email to submit posts'
          });
      } else {
        req.user = user;
        return next();
      }
    });
  },
  create:function (info){
    return jwt.sign(info, secrets.jwt, {
      expiresIn: 60 * 60 * 24 // expires in 24 hours
    });
  },
  verify: function(token,callback){
    jwt.verify(token, secrets.jwt, function(err, user) {
      if(err) return callback(err);
      return callback(null, user);
    });
  }
};
module.exports = mw;
