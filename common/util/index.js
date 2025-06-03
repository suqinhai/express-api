
const path = require('path');

/**
 * 路由处理函数包装器
 * 用于封装路由处理函数中的 try-catch 逻辑
 */

/**
 * 异步路由处理函数包装器
 * @param {Function} handler - 路由处理函数
 * @returns {Function} - 包装后的路由处理函数
 */
module.exports.asyncHandler = (handler) => {
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

module.exports.getEnvPath = () => {
    return path.resolve(__dirname, ('../../env/.env.' + process.env.NODE_ENV))
}




