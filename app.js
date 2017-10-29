var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const secrets = require('./config/secrets');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const passport = require('passport');
global.empty = require('is-empty');

var app = express();
//ADD WEBSOCKET
var expressWs = require('express-ws')(app);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//{url:"redis://admin:KYMRNAHCEPMYQJQB@sl-eu-fra-2-portal.0.dblayer.com:15459
app.use(session({
                  saveUninitialized:true,
                  resave: true,

                  store :  new RedisStore({host:'127.0.0.1', port:6379}),
                  secret:  secrets.cookie,
                  cookie : { httpOnly: true, secure : false, maxAge : (4 * 60 * 60 * 1000)}
                }));
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport.js')(passport);


app.use(
    (req,res,next)=>{
        req.data = {};
        return next()
    }
);




app.use('/', require('./routes/index'));
app.use('/authentication', require('./routes/authentication'));
app.use('/users', require('./routes/users'));
app.use('/validation', require('./routes/validate'));
app.use('/verification', require('./routes/verification'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err)
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
