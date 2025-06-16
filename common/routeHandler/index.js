/**
 * 路由处理函数包装器
 * 用于封装路由处理函数中的 try-catch 逻辑
 */

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
        res.status(500).json({
          code: 500,
          message: `操作失败: ${error.message || 'Undetailed error'}`
        });
      }
    };
  };
  
/**
 * 发送响应
 * @param {Object} res - Express 响应对象
 * @param {Number} status - HTTP状态码
 * @param {Boolean} success - 是否成功
 * @param {String} message - 响应消息
 * @param {Object} data - 响应数据
 * @returns {Object} Express 响应
 */
const sendResponse = (res, status, success, message, data = null) => {
  const responseBody = {
    success,
    message
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
 * @param {String} message - 错误消息
 * @param {Object} data - 附加数据
 * @returns {Object} Express 响应
 */
const sendError = (res, status = 400, message = '操作失败', data = null) => {
  return sendResponse(res, status, false, message, data);
};

/**
 * 发送成功响应
 * @param {Object} res - Express 响应对象
 * @param {String} message - 成功消息
 * @param {Object} data - 响应数据
 * @returns {Object} Express 响应
 */
const sendSuccess = (res, message = '操作成功', data = null) => {
  return sendResponse(res, 200, true, message, data);
};

/**
 * 发送参数错误响应
 * @param {Object} res - Express 响应对象
 * @param {String} message - 错误消息
 * @returns {Object} Express 响应
 */
const sendBadRequest = (res, message = '参数错误') => {
  return sendError(res, 400, message);
};

/**
 * 发送未授权响应
 * @param {Object} res - Express 响应对象
 * @param {String} message - 错误消息
 * @returns {Object} Express 响应
 */
const sendUnauthorized = (res, message = '未授权访问') => {
  return sendError(res, 401, message);
};

module.exports = {
  asyncHandler,
  sendResponse,
  sendError,
  sendSuccess,
  sendBadRequest,
  sendUnauthorized
};