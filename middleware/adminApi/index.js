/**
 * 管理端API专用中间件配置
 * 为管理端接口提供严格的认证、限流和权限控制
 */

const rateLimit = require('express-rate-limit');
const { validateAdmin, validateUser } = require('../auth');
const { adminApiType } = require('../apiType');
const { logger } = require('../../common/logger');

/**
 * 管理端API限流配置
 * 相对严格的限流策略，适合管理员使用
 */
const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 500, // 每个IP每15分钟最多500次请求（比用户端更严格）
  message: {
    success: false,
    message: '管理端请求过于频繁，请稍后再试',
    error: 'Too many admin requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 基于管理员ID的限流
  keyGenerator: (req) => {
    if (req.user && req.user.id && req.user.role === 'admin') {
      return `admin:${req.user.id}`;
    }
    return req.ip;
  },
  // 管理端不跳过任何请求的限流
  skip: () => false,
  handler: (req, res) => {
    logger.warn(`管理端API限流触发: IP=${req.ip}, Admin=${req.user?.id || 'unknown'}, Path=${req.path}`);
    // 记录安全事件
    logger.security(`管理端API限流触发 - 可能的异常访问`, {
      ip: req.ip,
      adminId: req.user?.id,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      message: '管理端请求过于频繁，请稍后再试',
      error: 'Too many admin requests from this IP, please try again later'
    });
  }
});

/**
 * 管理端严格认证中间件
 * 所有管理端接口都必须通过管理员认证
 */
const adminAuth = {
  /**
   * 标准管理员认证
   */
  required: validateAdmin,
  
  /**
   * 超级管理员认证
   * 需要更高级别的管理员权限
   */
  superAdmin: async (req, res, next) => {
    try {
      // 先进行标准管理员认证
      await validateAdmin(req, res, async () => {
        // 检查是否为超级管理员
        if (req.user.role !== 'super_admin' && req.user.level !== 'super') {
          logger.security(`非超级管理员尝试访问超级管理员接口`, {
            adminId: req.user.id,
            role: req.user.role,
            path: req.path,
            ip: req.ip
          });
          return res.sendUnauthorized('权限不足，需要超级管理员权限');
        }
        
        next();
      });
    } catch (error) {
      logger.error('超级管理员认证错误:', error);
      res.status(500).json({
        success: false,
        message: '认证服务异常'
      });
    }
  }
};

/**
 * 管理端权限检查中间件
 * @param {Array|string} permissions - 需要的权限
 * @param {Object} options - 选项配置
 */
function requireAdminPermissions(permissions, options = {}) {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  const { requireAll = false } = options; // 是否需要所有权限
  
  return (req, res, next) => {
    // 检查管理员是否已认证
    if (!req.user || req.user.role !== 'admin') {
      return res.sendUnauthorized('需要管理员权限才能访问此接口');
    }
    
    // 检查管理员状态
    if (req.user.status !== 'active') {
      logger.security(`非活跃管理员尝试访问接口`, {
        adminId: req.user.id,
        status: req.user.status,
        path: req.path
      });
      return res.sendUnauthorized('管理员账户状态异常，无法访问');
    }
    
    // 检查权限
    if (permissionArray.length > 0) {
      const adminPermissions = req.user.permissions || [];
      
      let hasPermission;
      if (requireAll) {
        // 需要所有权限
        hasPermission = permissionArray.every(permission => 
          adminPermissions.includes(permission)
        );
      } else {
        // 需要任一权限
        hasPermission = permissionArray.some(permission => 
          adminPermissions.includes(permission)
        );
      }
      
      if (!hasPermission) {
        logger.security(`管理员权限不足`, {
          adminId: req.user.id,
          requiredPermissions: permissionArray,
          adminPermissions: adminPermissions,
          path: req.path
        });
        
        const permissionText = requireAll ? '所有权限' : '以下权限之一';
        return res.sendUnauthorized(`权限不足，需要${permissionText}: ${permissionArray.join(', ')}`);
      }
    }
    
    // 记录管理员操作
    logger.info(`管理员操作记录`, {
      adminId: req.user.id,
      action: `${req.method} ${req.path}`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  };
}

/**
 * 敏感操作审计中间件
 * 记录敏感的管理操作
 */
function auditSensitiveOperation(operationType) {
  return (req, res, next) => {
    // 记录操作前状态
    const operationLog = {
      adminId: req.user?.id,
      operationType,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      requestBody: req.body,
      requestQuery: req.query
    };
    
    // 保存到请求对象，供后续使用
    req.auditLog = operationLog;
    
    // 记录操作日志
    logger.security(`敏感管理操作开始`, operationLog);
    
    // 拦截响应，记录操作结果
    const originalSend = res.send;
    res.send = function(data) {
      // 记录操作结果
      logger.security(`敏感管理操作完成`, {
        ...operationLog,
        statusCode: res.statusCode,
        success: res.statusCode < 400
      });
      
      // 调用原始send方法
      originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * 管理端中间件栈
 * 组合所有管理端专用中间件
 */
const adminApiMiddleware = {
  // 基础中间件栈（所有管理端接口都会应用）
  base: [
    adminApiType,      // 接口类型标识
    adminApiLimiter,   // 限流
    adminAuth.required // 管理员认证
  ],
  
  // 需要特定权限的接口中间件栈
  withPermissions: (permissions, options) => [
    adminApiType,
    adminApiLimiter,
    adminAuth.required,
    requireAdminPermissions(permissions, options)
  ],
  
  // 超级管理员接口中间件栈
  superAdmin: [
    adminApiType,
    adminApiLimiter,
    adminAuth.superAdmin
  ],
  
  // 敏感操作接口中间件栈
  sensitiveOperation: (operationType, permissions) => [
    adminApiType,
    adminApiLimiter,
    adminAuth.required,
    ...(permissions ? [requireAdminPermissions(permissions)] : []),
    auditSensitiveOperation(operationType)
  ]
};

module.exports = {
  adminApiLimiter,
  adminAuth,
  requireAdminPermissions,
  auditSensitiveOperation,
  adminApiMiddleware
};
