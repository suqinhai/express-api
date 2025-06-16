/**
 * 路由处理函数包装器
 * 用于封装路由处理函数中的 try-catch 逻辑
 */

// 引入i18next以便访问翻译功能
const { getI18n } = require('../i18n');

/**
 * 异步路由处理函数包装器
 * @param {Function} handler - 路由处理函数
 * @returns {Function} - 包装后的路由处理函数
 */
const asyncHandler = (handler) => {
    return async (req, res, next) => {
      try {
        await handler(req, res, next);
      } catch (error) {
        console.error(`路由错误: ${error.message}`, error.stack, error.original || '');
        const i18n = getI18n();
        res.status(500).json({
          code: 500,
          message: `${i18n.t('common.error')}: ${error.message || 'Undetailed error'}`
        });
      }
    };
  };
  
/**
 * 翻译消息文本
 * @param {Object} req - Express 请求对象
 * @param {String} message - 消息文本或翻译键
 * @param {Object} options - 翻译选项
 * @returns {String} 翻译后的文本
 */
const translateMessage = (req, message, options = {}) => {
  // 获取i18next实例
  const i18n = getI18n();
  
  // 如果消息看起来像翻译键（包含点号的简短字符串），尝试翻译
  if (typeof message === 'string' && message.includes('.') && message.length < 100) {
    // 使用i18next进行翻译，如果找不到对应的翻译，i18next会返回键名本身
    return i18n.t(message, options);
  }
  
  // 如果不是翻译键或翻译失败，返回原始消息
  return message;
};

/**
 * 发送响应
 * @param {Object} res - Express 响应对象
 * @param {Number} status - HTTP状态码
 * @param {Boolean} success - 是否成功
 * @param {String} message - 响应消息或翻译键
 * @param {Object} data - 响应数据
 * @returns {Object} Express 响应
 */
const sendResponse = (res, status, success, message, data = null) => {
  // 翻译消息
  const translatedMessage = translateMessage(res.req, message);
  
  const responseBody = {
    success,
    message: translatedMessage
  };

  if (data) {
    responseBody.data = data;
  }

  return res.status(status).json(responseBody);
};

/**
 * 发送错误响应
 * @param {Object} res - Express 响应对象
 * @param {Number} status - HTTP状态码 (默认: 400)
 * @param {String} message - 错误消息或翻译键
 * @param {Object} data - 附加数据
 * @returns {Object} Express 响应
 */
const sendError = (res, status = 400, message = 'common.error', data = null) => {
  return sendResponse(res, status, false, message, data);
};

/**
 * 发送成功响应
 * @param {Object} res - Express 响应对象
 * @param {String} message - 成功消息或翻译键
 * @param {Object} data - 响应数据
 * @returns {Object} Express 响应
 */
const sendSuccess = (res, message = 'common.success', data = null) => {
  return sendResponse(res, 200, true, message, data);
};

/**
 * 发送参数错误响应
 * @param {Object} res - Express 响应对象
 * @param {String} message - 错误消息或翻译键
 * @returns {Object} Express 响应
 */
const sendBadRequest = (res, message = 'common.badRequest') => {
  return sendError(res, 400, message);
};

/**
 * 发送未授权响应
 * @param {Object} res - Express 响应对象
 * @param {String} message - 错误消息或翻译键
 * @returns {Object} Express 响应
 */
const sendUnauthorized = (res, message = 'common.unauthorized') => {
  return sendError(res, 401, message);
};

/**
 * 翻译消息的快捷方法
 * @param {String} key - 翻译键
 * @param {Object} options - 翻译选项
 * @returns {String} 翻译后的文本
 */
const t = (req, key, options = {}) => {
  return translateMessage(req, key, options);
};

// 扩展Express请求和响应对象
const extendReqRes = (req, res, next) => {
  // 添加翻译方法到请求对象
  req.t = (key, options) => t(req, key, options);
  
  // 添加翻译方法到响应对象
  res.t = (key, options) => t(req, key, options);
  
  next();
};

module.exports = {
  asyncHandler,
  sendResponse,
  sendError,
  sendSuccess,
  sendBadRequest,
  sendUnauthorized,
  t,
  extendReqRes
};