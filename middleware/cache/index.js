/**
 * 缓存中间件
 * 提供路由级别的响应缓存机制，减少数据库负载并提高响应速度
 */

const CacheManager = require('../../common/redis/cache');
const { TTL, PREFIX } = require('../../common/redis');
const { logger } = require('../../common/logger');
const crypto = require('crypto');

/**
 * 生成缓存键
 * @param {Object} req - Express请求对象
 * @param {string} prefix - 缓存前缀
 * @returns {string} - 缓存键
 */
function generateCacheKey(req, prefix) {
  // 基础键：包含请求路径
  let key = `${req.method}:${req.originalUrl || req.url}`;
  
  // 如果需要，添加用户ID使缓存用户特定化
  if (req.user && req.user.id) {
    key = `user:${req.user.id}:${key}`;
  }
  
  // 如果请求体非空，将其作为键的一部分(针对POST/PUT请求)
  if (req.method !== 'GET' && Object.keys(req.body).length > 0) {
    const bodyHash = crypto
      .createHash('md5')
      .update(JSON.stringify(req.body))
      .digest('hex');
    key = `${key}:${bodyHash}`;
  }
  
  // 如果提供了前缀，添加前缀
  if (prefix) {
    key = `${prefix}:${key}`;
  }
  
  return key;
}

/**
 * 路由缓存中间件
 * 缓存路由响应结果，对于相同的请求直接返回缓存结果
 * 
 * @param {Object} options - 缓存选项
 * @param {number} options.ttl - 缓存过期时间(秒)
 * @param {string} options.prefix - 缓存键前缀
 * @param {Function} options.keyGenerator - 自定义缓存键生成函数
 * @param {Function} options.shouldCache - 自定义判断是否应缓存的函数
 * @returns {Function} Express中间件函数
 */
function routeCache(options = {}) {
  const {
    ttl = TTL.MEDIUM,
    prefix = PREFIX.CONFIG,
    keyGenerator = generateCacheKey,
    shouldCache = (req, res) => res.statusCode < 400 // 默认只缓存成功响应
  } = options;
  
  return async function(req, res, next) {
    // 对于非GET请求默认不缓存，除非明确配置
    if (req.method !== 'GET' && !options.cacheNonGetRequests) {
      return next();
    }
    
    // 生成缓存键
    const cacheKey = keyGenerator(req, prefix);
    
    try {
      // 尝试从缓存获取
      const cachedResponse = await CacheManager.get(prefix, cacheKey);
      
      // 如果有缓存，直接返回
      if (cachedResponse) {
        logger.debug(`缓存命中: ${cacheKey}`, { category: 'CACHE' });
        
        // 设置缓存标头
        res.set('X-Cache', 'HIT');
        
        // 从缓存中恢复状态码、头部和响应体
        res.status(cachedResponse.status);
        
        // 设置缓存的头部
        if (cachedResponse.headers) {
          Object.keys(cachedResponse.headers).forEach(header => {
            // 忽略某些特定的头部
            if (!['content-length', 'content-encoding'].includes(header.toLowerCase())) {
              res.set(header, cachedResponse.headers[header]);
            }
          });
        }
        
        // 返回缓存的响应体
        return res.send(cachedResponse.body);
      }
      
      // 缓存未命中，设置缓存标头
      res.set('X-Cache', 'MISS');
      
      // 保存原始的res.send方法
      const originalSend = res.send;
      
      // 覆盖res.send方法以便缓存响应
      res.send = function(body) {
        // 调用原始的send方法
        originalSend.call(this, body);
        
        // 如果响应可缓存，则进行缓存
        if (shouldCache(req, res)) {
          // 缓存响应数据
          const responseToCache = {
            status: res.statusCode,
            headers: res.getHeaders(),
            body: body
          };
          
          // 异步缓存，不等待完成
          CacheManager.set(prefix, cacheKey, responseToCache, ttl)
            .catch(err => logger.error(`缓存响应失败: ${cacheKey}`, { 
              category: 'CACHE', 
              error: err 
            }));
        }
        
        return this;
      };
      
      next();
    } catch (error) {
      // 如果缓存操作失败，记录错误但继续请求处理
      logger.error(`缓存中间件错误: ${cacheKey}`, { 
        category: 'CACHE', 
        error: error 
      });
      next();
    }
  };
}

/**
 * 清除特定路由的缓存
 * 
 * @param {Object} options - 清除选项
 * @param {string} options.prefix - 缓存键前缀
 * @param {string|RegExp} options.pattern - 要清除的缓存键模式
 * @returns {Function} Express中间件函数
 */
function clearRouteCache(options = {}) {
  const {
    prefix = PREFIX.CONFIG,
    pattern
  } = options;
  
  return async function(req, res, next) {
    try {
      if (pattern) {
        // 使用模式清除匹配的缓存
        const keys = await CacheManager.clearByPattern(prefix, pattern);
        logger.info(`已清除${keys.length}项匹配缓存`, { category: 'CACHE' });
      } else {
        // 清除此前缀下的所有缓存
        await CacheManager.clearByType(prefix);
        logger.info(`已清除所有${prefix}缓存`, { category: 'CACHE' });
      }
      next();
    } catch (error) {
      logger.error(`清除缓存失败: ${prefix}`, { 
        category: 'CACHE', 
        error: error 
      });
      next();
    }
  };
}

module.exports = {
  routeCache,
  clearRouteCache
}; 