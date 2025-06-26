/**
 * 基础控制器类
 * 提供通用的控制器功能和方法
 * 所有控制器都应该继承此类
 */

const { logger } = require('../../common/logger');

class BaseController {
  constructor() {
    this.logger = logger;
  }

  /**
   * 异步方法包装器，自动处理错误
   * @param {Function} fn - 异步函数
   * @returns {Function} Express中间件函数
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 响应消息
   * @param {Object} data - 响应数据
   * @param {number} statusCode - HTTP状态码
   */
  sendSuccess(res, message = '操作成功', data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {Array} errors - 详细错误信息
   */
  sendError(res, message = '操作失败', statusCode = 400, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * 分页响应
   * @param {Object} res - Express响应对象
   * @param {Array} data - 数据列表
   * @param {Object} pagination - 分页信息
   * @param {string} message - 响应消息
   */
  sendPaginatedResponse(res, data, pagination, message = '获取数据成功') {
    return this.sendSuccess(res, message, {
      items: data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      }
    });
  }

  /**
   * 验证请求参数
   * @param {Object} req - Express请求对象
   * @param {Array} requiredFields - 必需字段列表
   * @returns {Object|null} 验证错误或null
   */
  validateRequiredFields(req, requiredFields) {
    const errors = [];
    const data = { ...req.body, ...req.query, ...req.params };

    requiredFields.forEach(field => {
      if (!data[field] || data[field] === '') {
        errors.push({
          field,
          message: `${field} 是必需的`
        });
      }
    });

    return errors.length > 0 ? errors : null;
  }

  /**
   * 获取分页参数
   * @param {Object} req - Express请求对象
   * @param {number} defaultLimit - 默认每页数量
   * @returns {Object} 分页参数
   */
  getPaginationParams(req, defaultLimit = 20) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defaultLimit));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * 获取排序参数
   * @param {Object} req - Express请求对象
   * @param {string} defaultSort - 默认排序字段
   * @param {string} defaultOrder - 默认排序方向
   * @returns {Object} 排序参数
   */
  getSortParams(req, defaultSort = 'created_at', defaultOrder = 'DESC') {
    const sortBy = req.query.sortBy || defaultSort;
    const sortOrder = (req.query.sortOrder || defaultOrder).toUpperCase();
    
    return {
      sortBy,
      sortOrder: ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC'
    };
  }

  /**
   * 记录操作日志
   * @param {string} action - 操作类型
   * @param {Object} req - Express请求对象
   * @param {Object} details - 详细信息
   */
  logAction(action, req, details = {}) {
    this.logger.info(`控制器操作: ${action}`, {
      action,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      ...details
    });
  }

  /**
   * 记录错误日志
   * @param {string} action - 操作类型
   * @param {Error} error - 错误对象
   * @param {Object} req - Express请求对象
   */
  logError(action, error, req) {
    this.logger.error(`控制器错误: ${action}`, {
      action,
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
  }
}

module.exports = BaseController;
