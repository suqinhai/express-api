var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
var cors = require('cors');
var helmet = require('helmet');
var compression = require('compression');
var swaggerJsdoc = require('swagger-jsdoc');
var swaggerUi = require('swagger-ui-express');
var morganLogger = require('morgan');  // 重命名morgan日志器，避免冲突
var { requestLogger, logger } = require('./common/logger'); // 直接从logger模块导入

var { sequelize, mongodb, sendSuccess, sendError, sendBadRequest, sendUnauthorized, sendResponse, initI18n, createMiddleware } = require('./common/index')
var { globalLimiter } = require('./middleware');

// var indexRouter = require('./routes/index');
var app = express();

// 初始化i18n和数据库连接
(async () => {
  try {
    await initI18n();
    console.log('i18n initialized successfully');

    // 初始化MongoDB连接
    try {
      await mongodb.connectMongoDB();
      console.log('MongoDB connection initialized successfully');
    } catch (error) {
      console.warn('MongoDB connection failed, continuing without MongoDB:', error.message);
    }
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

// 使用压缩中间件减小响应体积，提高传输速度
app.use(compression({
  level: 6,                    // 压缩级别，范围1-9，数字越大压缩越好，但CPU使用越多，默认是6
  threshold: 1024,             // 只压缩大于1KB的响应
  filter: (req, res) => {      // 筛选需要压缩的响应
    if (req.headers['x-no-compression']) {
      return false;            // 不压缩带有特定头部的请求
    }
    return compression.filter(req, res); // 使用默认过滤器
  }
}));

// 应用全局API请求限流
app.use(globalLimiter);

// app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.sequelize = sequelize;
  res.mongodb = mongodb;
  res.sendResponse = (status, success, message, options) => sendResponse(res, status, success, message, options);
  res.sendSuccess = (message, options) => sendSuccess(res, message, options);
  res.sendBadRequest = (message, options) => sendBadRequest(res, message, options);
  res.sendUnauthorized = (message, options) => sendUnauthorized(res, message, options);
  next();
});
// 在开发环境保留morgan日志，在生产环境使用Winston日志
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
  app.use(morganLogger('dev')); // 使用重命名的morgan日志器
} else {
  app.use(requestLogger()); // 使用Winston的requestLogger
}
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// 配置静态资源缓存和静态文件服务
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,                // 启用ETag头
  lastModified: true,        // 启用Last-Modified头
  setHeaders: (res, path) => {
    // 根据文件类型设置不同的缓存策略
    if (path.endsWith('.html')) {
      // HTML文件设置较短的缓存时间
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5分钟
    } else if (path.match(/\.(css|js)$/)) {
      // CSS和JS文件设置较长的缓存时间，添加版本号来实现更新
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1天
    } else if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/)) {
      // 图片文件设置更长的缓存时间
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30天
    } else if (path.match(/\.(woff|woff2|ttf|eot|otf)$/)) {
      // 字体文件设置很长的缓存时间
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年
    } else {
      // 其他静态资源设置默认缓存时间
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小时
    }
  }
}));

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
        url: process.env.API_BASE_URL || 'http://localhost:3000',
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

// 创建用户端API文档配置
const userApiSwaggerOptions = {
  ...swaggerOptions,
  definition: {
    ...swaggerOptions.definition,
    info: {
      title: '用户端API文档',
      version: '1.0.0',
      description: '用户端API接口文档，提供面向普通用户的功能接口',
      contact: {
        name: '技术支持',
        email: 'support@example.com'
      }
    }
  },
  apis: [
    path.join(__dirname, './routes/user-api/**/*.js')
  ]
};

// 创建管理端API文档配置
const adminApiSwaggerOptions = {
  ...swaggerOptions,
  definition: {
    ...swaggerOptions.definition,
    info: {
      title: '管理端API文档',
      version: '1.0.0',
      description: '管理端API接口文档，提供面向管理员的管理功能接口',
      contact: {
        name: '技术支持',
        email: 'support@example.com'
      }
    }
  },
  apis: [
    path.join(__dirname, './routes/admin-api/**/*.js')
  ]
};

const userApiSwaggerSpec = swaggerJsdoc(userApiSwaggerOptions);
const adminApiSwaggerSpec = swaggerJsdoc(adminApiSwaggerOptions);

// 设置通用Swagger UI路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '通用API文档'
}));

// 设置用户端Swagger UI路由
app.use('/api-docs/user', swaggerUi.serve, swaggerUi.setup(userApiSwaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '用户端API文档'
}));

// 设置管理端Swagger UI路由
app.use('/api-docs/admin', swaggerUi.serve, swaggerUi.setup(adminApiSwaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '管理端API文档'
}));

// 提供Swagger JSON端点
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/api-docs/user.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(userApiSwaggerSpec);
});

app.get('/api-docs/admin.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(adminApiSwaggerSpec);
});

console.log('Swagger文档已启用:');
console.log('  通用API文档: http://localhost:3000/api-docs');
console.log('  用户端API文档: http://localhost:3000/api-docs/user');
console.log('  管理端API文档: http://localhost:3000/api-docs/admin');

const routes = require('./routes');
app.use('/api', routes);

const { quick } = require('./middleware');
const { errorHandler, notFoundHandler } = quick;

// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

module.exports = app;
