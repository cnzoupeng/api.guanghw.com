var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('./routes/base').config;

var main = require('./routes/main');
var user = require('./routes/user');
var auth = require('./routes/auth');
var multer  = require('multer');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(express.static(path.join(__dirname, 'public')));

app.all('*', function(req, res, next){
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Credentials', 'true');
  res.append('Access-Control-Allow-Methods', 'GET, POST, OPTIONS,DELETE,PUT');
  res.append('Access-Control-Allow-Headers', 'Authorization,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type');

  req.user = {uid: 962990};
  next();
});

app.use(expressJwt({secret: config.secret, skip: auth.authSkip}));
app.use('/', main);
app.use('/auth', auth);
app.use(multer({ dest: 'uploads/', rename: function(fieldname, filename) {return filename;}}));
app.use('/user', user);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).json({code: 404, msg: 'Not Found'});
});

// error handlers
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({code: err.status || 500, msg: err.message});
});

module.exports = app;
