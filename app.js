var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
var cors = require('cors');
var helmet = require('helmet');
var swaggerJsdoc = require('swagger-jsdoc');
var swaggerUi = require('swagger-ui-express');
var { requestLogger } = require('./common/logger');

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
app.use(requestLogger()); // 使用自定义请求日志中间件替代morgan
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 配置Swagger文档
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '后台API文档',
      version: '1.0.0',
      description: '后台API接口文档，提供系统所有API的详细说明和调试功能',
      contact: {
        name: '技术支持',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? '生产环境' : '开发环境'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: '操作失败' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'username' },
                  message: { type: 'string', example: '用户名必须介于4-20个字符之间' }
                }
              },
              example: [
                { field: 'username', message: '用户名必须介于4-20个字符之间' }
              ]
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: '操作成功' },
            data: { type: 'object', example: {} }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { 
              type: 'integer', 
              description: '用户ID',
              example: 1 
            },
            username: { 
              type: 'string', 
              description: '用户名',
              example: 'admin' 
            },
            email: { 
              type: 'string', 
              format: 'email',
              description: '邮箱地址',
              example: 'admin@example.com' 
            },
            status: { 
              type: 'string', 
              description: '用户状态',
              enum: ['active', 'inactive', 'locked', 'pending'],
              example: 'active' 
            },
            created_at: { 
              type: 'string', 
              format: 'date-time',
              description: '创建时间',
              example: '2023-01-01T00:00:00Z' 
            },
            last_login: { 
              type: 'string', 
              format: 'date-time',
              description: '最后登录时间',
              example: '2023-01-01T12:30:00Z' 
            }
          }
        }
      }
    },
    security: [{ BearerAuth: [] }]
  },
  apis: [
    path.join(__dirname, './routes/**/*.js'),
    path.join(__dirname, './models/**/*.js')
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 设置Swagger UI路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '后台API文档'
}));

// 提供Swagger JSON端点
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

console.log('Swagger文档已启用: http://localhost:3001/api-docs');

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
