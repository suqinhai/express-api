/**
 * 接口类型标识中间件
 * 为不同类型的接口添加标识，便于后续处理和统计
 */

const { logger } = require('../../common/logger');

// 接口类型常量
const API_TYPES = {
  USER: 'user',
  ADMIN: 'admin',
  GENERAL: 'general'
};

/**
 * 创建接口类型标识中间件
 * @param {string} apiType - 接口类型 (user/admin/general)
 * @returns {Function} Express中间件函数
 */
function createApiTypeMiddleware(apiType) {
  // 验证接口类型
  if (!Object.values(API_TYPES).includes(apiType)) {
    throw new Error(`无效的接口类型: ${apiType}. 支持的类型: ${Object.values(API_TYPES).join(', ')}`);
  }

  return function apiTypeMiddleware(req, res, next) {
    try {
      // 在请求对象中添加接口类型标识
      req.apiType = apiType;
      
      // 在响应头中添加接口类型标识（用于调试和监控）
      res.set('X-API-Type', apiType);
      
      // 记录接口类型信息（仅在开发环境）
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
        logger.debug(`接口类型: ${apiType}, 路径: ${req.path}, 方法: ${req.method}`);
      }
      
      // 为不同类型的接口设置不同的响应头
      switch (apiType) {
        case API_TYPES.USER:
          res.set('X-API-Audience', 'end-user');
          break;
        case API_TYPES.ADMIN:
          res.set('X-API-Audience', 'administrator');
          break;
        case API_TYPES.GENERAL:
          res.set('X-API-Audience', 'public');
          break;
      }
      
      next();
    } catch (error) {
      logger.error('接口类型中间件错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

/**
 * 用户端接口标识中间件
 */
const userApiType = createApiTypeMiddleware(API_TYPES.USER);

/**
 * 管理端接口标识中间件
 */
const adminApiType = createApiTypeMiddleware(API_TYPES.ADMIN);

/**
 * 通用接口标识中间件
 */
const generalApiType = createApiTypeMiddleware(API_TYPES.GENERAL);

/**
 * 获取请求的接口类型
 * @param {Object} req - Express请求对象
 * @returns {string} 接口类型
 */
function getApiType(req) {
  return req.apiType || API_TYPES.GENERAL;
}

/**
 * 检查是否为指定类型的接口
 * @param {Object} req - Express请求对象
 * @param {string} expectedType - 期望的接口类型
 * @returns {boolean} 是否匹配
 */
function isApiType(req, expectedType) {
  return getApiType(req) === expectedType;
}

module.exports = {
  API_TYPES,
  createApiTypeMiddleware,
  userApiType,
  adminApiType,
  generalApiType,
  getApiType,
  isApiType
};
