var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors');

var { sequelize, sendSuccess, sendError, sendBadRequest, sendUnauthorized, sendResponse, initI18n, createMiddleware } = require('./common/index')

var indexRouter = require('./routes/index');
var app = express();

// 初始化i18n
(async () => {
  try {
    await initI18n();
    console.log('i18n initialized successfully');
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
  }
})();
// 添加i18n中间件 (必须在其他路由之前)
app.use(createMiddleware());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.sequelize = sequelize;
  res.sendResponse = (status, success, message, options) => sendResponse(res, status, success, message, options);
  res.sendSuccess = (message, options) => sendSuccess(res, message, options);
  res.sendBadRequest = (message, options) => sendBadRequest(res, message, options);
  res.sendUnauthorized = (message, options) => sendUnauthorized(res, message, options);
  next();
});
app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
