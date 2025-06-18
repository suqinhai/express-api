/**
 * 请求频率限制中间件
 * 用于限制API请求频率，防止暴力攻击和DoS攻击
 */

const rateLimit = require('express-rate-limit');
const { redis } = require('../../common/redis');

/**
 * 创建Redis存储适配器（可选，需要RedisStore依赖）
 * 如果需要使用Redis存储限流数据，可以解开这段注释
 */
/* 
const RedisStore = require('rate-limit-redis');

const redisStore = new RedisStore({
  // redis实例
  client: redis,
  // 键前缀
  prefix: 'rate-limit:',
  // 使用Redis INCR操作
  sendCommand: (...args) => redis.call(...args)
}); 
*/

/**
 * 默认全局限流中间件
 * 适用于所有API路由的通用限流
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口期
  max: 100, // 每个IP在窗口期内最多100个请求
  standardHeaders: true, // 返回标准的RateLimit头部
  legacyHeaders: false, // 禁用旧头部
  message: {
    success: false,
    message: '请求过于频繁，请稍后重试'
  }
});

/**
 * 登录接口限流中间件
 * 对登录接口实施更严格的限流，防止暴力破解
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时窗口期
  max: 5, // 每个IP在窗口期内最多5次登录尝试
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '登录尝试次数过多，请1小时后再试'
  }
});

/**
 * 注册接口限流中间件
 * 限制注册频率，防止批量注册
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时窗口期
  max: 3, // 每个IP在窗口期内最多3次注册尝试
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '注册尝试次数过多，请1小时后再试'
  }
});

/**
 * API接口限流中间件
 * 用于一般API接口的请求频率限制
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟窗口期
  max: 60, // 每个IP在窗口期内最多60次请求（平均每秒1次）
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API请求频率超限，请稍后重试'
  }
});

module.exports = {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  apiLimiter
}; 