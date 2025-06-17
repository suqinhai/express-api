/**
 * 日志记录模块
 * 提供统一的日志记录功能，用于监控应用性能和错误
 */

// 日志级别
const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  };
  
  // 日志分类
  const LOG_CATEGORIES = {
    DATABASE: 'database',
    CACHE: 'cache',
    AUTH: 'auth',
    REQUEST: 'request',
    SYSTEM: 'system'
  };
  
  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} category - 日志分类
   * @param {string} message - 日志消息
   * @param {Object} [data] - 附加数据
   * @returns {string} - 格式化后的日志消息
   */
  function formatLogMessage(level, category, message, data = null) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
    
    if (data) {
      // 处理错误对象
      if (data instanceof Error) {
        logMessage += `\nError: ${data.message}\nStack: ${data.stack || '(No stack trace)'}`;
        
        // 添加额外的错误属性
        const errorDetails = {};
        Object.getOwnPropertyNames(data).forEach(key => {
          if (key !== 'stack' && key !== 'message') {
            errorDetails[key] = data[key];
          }
        });
        
        if (Object.keys(errorDetails).length > 0) {
          logMessage += `\nDetails: ${JSON.stringify(errorDetails, null, 2)}`;
        }
      } else {
        // 对普通对象进行格式化
        try {
          const dataString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          logMessage += `\nData: ${dataString}`;
        } catch (error) {
          logMessage += `\nData: [无法序列化的数据]`;
        }
      }
    }
    
    return logMessage;
  }
  
  /**
   * 记录日志
   * @param {string} level - 日志级别
   * @param {string} category - 日志分类
   * @param {string} message - 日志消息
   * @param {Object} [data] - 附加数据
   */
  function log(level, category, message, data = null) {
    const formattedMessage = formatLogMessage(level, category, message, data);
    
    switch (level) {
      case LOG_LEVELS.DEBUG:
        if (process.env.NODE_ENV === 'dev') {
          console.debug(formattedMessage);
        }
        break;
      case LOG_LEVELS.INFO:
        console.info(formattedMessage);
        break;
      case LOG_LEVELS.WARN:
        console.warn(formattedMessage);
        break;
      case LOG_LEVELS.ERROR:
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
    
    // TODO: 可以在此添加持久化日志存储，如写入文件或发送到日志服务
  }
  
  /**
   * 记录数据库性能日志
   * @param {string} operation - 数据库操作类型
   * @param {number} duration - 操作耗时（毫秒）
   * @param {string} query - SQL查询语句
   * @param {Object} [params] - 查询参数
   */
  function logDatabasePerformance(operation, duration, query, params = null) {
    // 对耗时较长的数据库操作进行警告
    const level = duration > 500 ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    
    log(level, LOG_CATEGORIES.DATABASE, `${operation} 耗时 ${duration}ms`, {
      query,
      params,
      duration
    });
  }
  
  /**
   * 记录缓存性能日志
   * @param {string} operation - 缓存操作类型
   * @param {number} duration - 操作耗时（毫秒）
   * @param {string} key - 缓存键
   * @param {boolean} hit - 是否命中缓存
   */
  function logCachePerformance(operation, duration, key, hit = null) {
    // 对耗时较长的缓存操作进行警告
    const level = duration > 200 ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    
    log(level, LOG_CATEGORIES.CACHE, `${operation} 耗时 ${duration}ms`, {
      key,
      hit,
      duration
    });
  }
  
  /**
   * 记录请求性能日志
   * @param {Object} req - 请求对象
   * @param {number} duration - 请求处理耗时（毫秒）
   * @param {number} statusCode - HTTP状态码
   */
  function logRequestPerformance(req, duration, statusCode) {
    // 对耗时较长的请求进行警告
    const level = duration > 1000 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    
    log(level, LOG_CATEGORIES.REQUEST, `${req.method} ${req.path} ${statusCode} 耗时 ${duration}ms`, {
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode,
      duration,
      userAgent: req.headers['user-agent']
    });
  }
  
  /**
   * 记录错误日志
   * @param {string} category - 错误分类
   * @param {string} message - 错误消息
   * @param {Error|Object} error - 错误对象或附加数据
   */
  function logError(category, message, error) {
    log(LOG_LEVELS.ERROR, category, message, error);
  }
  
  module.exports = {
    LOG_LEVELS,
    LOG_CATEGORIES,
    log,
    logDatabasePerformance,
    logCachePerformance,
    logRequestPerformance,
    logError
  };