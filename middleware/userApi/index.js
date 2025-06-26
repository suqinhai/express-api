/**
 * 用户端API专用中间件配置
 * 为用户端接口提供专门的认证、限流和权限控制
 */

const rateLimit = require('express-rate-limit');
const { validateUser } = require('../auth');
const { userApiType } = require('../apiType');
const { logger } = require('../../common/logger');

/**
 * 用户端API限流配置
 * 相对宽松的限流策略，适合普通用户使用
 */
const userApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP每15分钟最多1000次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 自定义键生成器，可以基于用户ID而不是IP
  keyGenerator: (req) => {
    // 如果用户已认证，使用用户ID作为限流键
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    // 否则使用IP地址
    return req.ip;
  },
  // 跳过某些请求的限流
  skip: (req) => {
    // 跳过健康检查等基础接口
    return req.path === '/health' || req.path === '/';
  },
  handler: (req, res) => {
    logger.warn(`用户端API限流触发: IP=${req.ip}, User=${req.user?.id || 'anonymous'}, Path=${req.path}`);
    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试',
      error: 'Too many requests from this IP, please try again later'
    });
  }
});

/**
 * 用户端认证中间件
 * 可选认证：某些接口需要认证，某些不需要
 */
const userAuth = {
  /**
   * 必须认证的中间件
   */
  required: validateUser,
  
  /**
   * 可选认证的中间件
   * 如果提供了token则验证，没有提供则跳过
   */
  optional: async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        // 没有token，设置为匿名用户
        req.user = null;
        req.isAuthenticated = false;
        return next();
      }
      
      // 有token，尝试验证
      validateUser(req, res, (error) => {
        if (error) {
          // 验证失败，但不阻止请求继续
          req.user = null;
          req.isAuthenticated = false;
          logger.warn(`用户端可选认证失败: ${error.message}`);
        } else {
          req.isAuthenticated = true;
        }
        next();
      });
    } catch (error) {
      // 认证过程出错，设置为匿名用户
      req.user = null;
      req.isAuthenticated = false;
      logger.error('用户端可选认证错误:', error);
      next();
    }
  }
};

/**
 * 用户端权限检查中间件
 * @param {Array|string} permissions - 需要的权限
 */
function requireUserPermissions(permissions) {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  return (req, res, next) => {
    // 检查用户是否已认证
    if (!req.user) {
      return res.sendUnauthorized('需要登录才能访问此接口');
    }
    
    // 检查用户状态
    if (req.user.status !== 'active') {
      return res.sendUnauthorized('用户状态异常，无法访问');
    }
    
    // 检查权限（如果用户有权限字段）
    if (req.user.permissions && permissionArray.length > 0) {
      const userPermissions = req.user.permissions || [];
      const hasPermission = permissionArray.some(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.sendUnauthorized(`权限不足，需要以下权限之一: ${permissionArray.join(', ')}`);
      }
    }
    
    next();
  };
}

/**
 * 用户端中间件栈
 * 组合所有用户端专用中间件
 */
const userApiMiddleware = {
  // 基础中间件栈（所有用户端接口都会应用）
  base: [
    userApiType,      // 接口类型标识
    userApiLimiter    // 限流
  ],
  
  // 需要认证的接口中间件栈
  authenticated: [
    userApiType,
    userApiLimiter,
    userAuth.required
  ],
  
  // 可选认证的接口中间件栈
  optionalAuth: [
    userApiType,
    userApiLimiter,
    userAuth.optional
  ],
  
  // 需要特定权限的接口中间件栈
  withPermissions: (permissions) => [
    userApiType,
    userApiLimiter,
    userAuth.required,
    requireUserPermissions(permissions)
  ]
};

module.exports = {
  userApiLimiter,
  userAuth,
  requireUserPermissions,
  userApiMiddleware
};
