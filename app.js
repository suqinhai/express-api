var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors');
var helmet = require('helmet');

var { sequelize, sendSuccess, sendError, sendBadRequest, sendUnauthorized, sendResponse, initI18n, createMiddleware } = require('./common/index')
var { globalLimiter } = require('./middleware');

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

// 使用 helmet 中间件增强安全性
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // 允许内联脚本
      styleSrc: ["'self'", "'unsafe-inline'"], // 允许内联样式
      imgSrc: ["'self'", 'data:'], // 允许数据URL图片
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    }
  },
  crossOriginEmbedderPolicy: false, // 如果需要嵌入第三方资源，可能需要禁用此策略
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  // 其他安全头部设置
  xssFilter: true,
  noSniff: true,
  hsts: {
    maxAge: 15552000, // 180天
    includeSubDomains: true,
    preload: true
  }
}));

// 应用全局API请求限流
app.use(globalLimiter);

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
