/**
 * 统一错误处理中间件
 * 提供标准化的错误响应和错误日志记录
 */

const { logger } = require('../../common/logger');

// 错误类型定义
const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  DATABASE: 'DATABASE_ERROR',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  INTERNAL: 'INTERNAL_SERVER_ERROR'
};

// 错误码定义
const ERROR_CODES = {
  // 客户端错误 4xx
  VALIDATION_FAILED: 40001,
  INVALID_CREDENTIALS: 40101,
  TOKEN_EXPIRED: 40102,
  TOKEN_INVALID: 40103,
  INSUFFICIENT_PERMISSIONS: 40301,
  RESOURCE_NOT_FOUND: 40401,
  METHOD_NOT_ALLOWED: 40501,
  RATE_LIMIT_EXCEEDED: 42901,
  
  // 服务器错误 5xx
  INTERNAL_SERVER_ERROR: 50001,
  DATABASE_CONNECTION_ERROR: 50002,
  DATABASE_QUERY_ERROR: 50003,
  EXTERNAL_SERVICE_ERROR: 50004,
  CACHE_ERROR: 50005
};

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, errorCode, errorType = ERROR_TYPES.INTERNAL, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorType = errorType;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误类
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, ERROR_CODES.VALIDATION_FAILED, ERROR_TYPES.VALIDATION, details);
  }
}

// 认证错误类
class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, ERROR_CODES.INVALID_CREDENTIALS, ERROR_TYPES.AUTHENTICATION);
  }
}

// 授权错误类
class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, ERROR_CODES.INSUFFICIENT_PERMISSIONS, ERROR_TYPES.AUTHORIZATION);
  }
}

// 资源未找到错误类
class NotFoundError extends AppError {
  constructor(message = '资源未找到') {
    super(message, 404, ERROR_CODES.RESOURCE_NOT_FOUND, ERROR_TYPES.NOT_FOUND);
  }
}

// 数据库错误类
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    const errorCode = originalError?.code === 'ECONNREFUSED' 
      ? ERROR_CODES.DATABASE_CONNECTION_ERROR 
      : ERROR_CODES.DATABASE_QUERY_ERROR;
    
    super(message, 500, errorCode, ERROR_TYPES.DATABASE, {
      originalError: originalError?.message,
      sqlState: originalError?.sqlState,
      errno: originalError?.errno
    });
  }
}

// 限流错误类
class RateLimitError extends AppError {
  constructor(message = '请求过于频繁，请稍后再试') {
    super(message, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED, ERROR_TYPES.RATE_LIMIT);
  }
}

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  const errorLog = {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null,
    timestamp: new Date().toISOString(),
    errorType: error.errorType || ERROR_TYPES.INTERNAL,
    errorCode: error.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR
  };

  // 根据错误类型选择日志级别
  if (error.statusCode >= 500) {
    logger.error('服务器内部错误', errorLog);
  } else if (error.statusCode >= 400) {
    logger.warn('客户端错误', errorLog);
  } else {
    logger.info('其他错误', errorLog);
  }

  // 处理特定类型的错误
  if (err.name === 'ValidationError') {
    error = new ValidationError('数据验证失败', err.errors);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('无效的访问令牌');
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('访问令牌已过期');
  } else if (err.name === 'SequelizeConnectionError') {
    error = new DatabaseError('数据库连接失败', err);
  } else if (err.name === 'SequelizeValidationError') {
    error = new ValidationError('数据验证失败', err.errors);
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('文件大小超出限制');
  } else if (!error.isOperational) {
    // 未知错误，转换为通用内部服务器错误
    error = new AppError(
      process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      ERROR_TYPES.INTERNAL
    );
  }

  // 构建错误响应
  const errorResponse = {
    success: false,
    error: {
      message: error.message,
      code: error.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
      type: error.errorType || ERROR_TYPES.INTERNAL,
      timestamp: error.timestamp || new Date().toISOString()
    }
  };

  // 开发环境下包含更多调试信息
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = error.details;
  }

  // 验证错误包含详细信息
  if (error.details && error.errorType === ERROR_TYPES.VALIDATION) {
    errorResponse.error.validation = error.details;
  }

  // 设置响应状态码并返回错误信息
  res.status(error.statusCode || 500).json(errorResponse);
};

// 404错误处理中间件
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`路由 ${req.originalUrl} 未找到`);
  next(error);
};

// 异步错误包装器
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  // 错误类
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  RateLimitError,
  
  // 错误常量
  ERROR_TYPES,
  ERROR_CODES,
  
  // 中间件
  errorHandler,
  notFoundHandler,
  asyncHandler
};
