/**
 * 性能监控中间件
 * 监控API响应时间、内存使用、请求统计等性能指标
 */

const { logger } = require('../../common/logger');
const os = require('os');

// 性能统计数据存储
const performanceStats = {
  requests: {
    total: 0,
    success: 0,
    error: 0,
    byMethod: {},
    byRoute: {},
    byStatusCode: {}
  },
  responseTime: {
    total: 0,
    count: 0,
    min: Infinity,
    max: 0,
    avg: 0,
    percentiles: {
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0
    }
  },
  memory: {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    rss: 0
  },
  system: {
    cpuUsage: 0,
    loadAverage: [],
    uptime: 0
  },
  errors: {
    total: 0,
    byType: {},
    recent: []
  }
};

// 响应时间历史记录（用于计算百分位数）
const responseTimeHistory = [];
const MAX_HISTORY_SIZE = 1000;

// 性能监控中间件
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  // 记录请求开始
  performanceStats.requests.total++;
  
  // 统计请求方法
  const method = req.method;
  performanceStats.requests.byMethod[method] = (performanceStats.requests.byMethod[method] || 0) + 1;
  
  // 统计路由
  const route = req.route?.path || req.path || 'unknown';
  performanceStats.requests.byRoute[route] = (performanceStats.requests.byRoute[route] || 0) + 1;
  
  // 监听响应结束事件
  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const endMemory = process.memoryUsage();
    
    // 更新响应时间统计
    updateResponseTimeStats(responseTime);
    
    // 统计状态码
    const statusCode = res.statusCode;
    performanceStats.requests.byStatusCode[statusCode] = 
      (performanceStats.requests.byStatusCode[statusCode] || 0) + 1;
    
    // 统计成功/失败请求
    if (statusCode >= 200 && statusCode < 400) {
      performanceStats.requests.success++;
    } else {
      performanceStats.requests.error++;
      
      // 记录错误信息
      if (statusCode >= 400) {
        recordError(req, res, statusCode);
      }
    }
    
    // 更新内存使用统计
    updateMemoryStats(endMemory);
    
    // 记录性能日志（仅记录慢请求）
    const slowRequestThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000;
    if (responseTime > slowRequestThreshold) {
      logger.warn('慢请求检测', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        memoryDelta: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal
        }
      });
    }
    
    // 设置响应头
    res.set('X-Response-Time', `${responseTime}ms`);
  });
  
  next();
};

// 更新响应时间统计
function updateResponseTimeStats(responseTime) {
  performanceStats.responseTime.total += responseTime;
  performanceStats.responseTime.count++;
  performanceStats.responseTime.min = Math.min(performanceStats.responseTime.min, responseTime);
  performanceStats.responseTime.max = Math.max(performanceStats.responseTime.max, responseTime);
  performanceStats.responseTime.avg = performanceStats.responseTime.total / performanceStats.responseTime.count;
  
  // 添加到历史记录
  responseTimeHistory.push(responseTime);
  if (responseTimeHistory.length > MAX_HISTORY_SIZE) {
    responseTimeHistory.shift();
  }
  
  // 计算百分位数
  if (responseTimeHistory.length > 10) {
    const sorted = [...responseTimeHistory].sort((a, b) => a - b);
    const len = sorted.length;
    
    performanceStats.responseTime.percentiles.p50 = sorted[Math.floor(len * 0.5)];
    performanceStats.responseTime.percentiles.p90 = sorted[Math.floor(len * 0.9)];
    performanceStats.responseTime.percentiles.p95 = sorted[Math.floor(len * 0.95)];
    performanceStats.responseTime.percentiles.p99 = sorted[Math.floor(len * 0.99)];
  }
}

// 更新内存使用统计
function updateMemoryStats(memoryUsage) {
  performanceStats.memory = {
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
    external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
  };
}

// 记录错误信息
function recordError(req, res, statusCode) {
  performanceStats.errors.total++;
  
  const errorType = getErrorType(statusCode);
  performanceStats.errors.byType[errorType] = (performanceStats.errors.byType[errorType] || 0) + 1;
  
  // 记录最近的错误
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    statusCode: statusCode,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };
  
  performanceStats.errors.recent.unshift(errorInfo);
  if (performanceStats.errors.recent.length > 50) {
    performanceStats.errors.recent.pop();
  }
}

// 获取错误类型
function getErrorType(statusCode) {
  if (statusCode >= 400 && statusCode < 500) {
    return 'client_error';
  } else if (statusCode >= 500) {
    return 'server_error';
  }
  return 'unknown';
}

// 更新系统统计信息
function updateSystemStats() {
  const cpuUsage = process.cpuUsage();
  performanceStats.system = {
    cpuUsage: Math.round((cpuUsage.user + cpuUsage.system) / 1000), // 毫秒
    loadAverage: os.loadavg(),
    uptime: Math.round(process.uptime())
  };
}

// 获取性能统计信息
const getPerformanceStats = () => {
  updateSystemStats();
  
  return {
    ...performanceStats,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: os.platform(),
    arch: os.arch()
  };
};

// 重置统计信息
const resetStats = () => {
  performanceStats.requests = {
    total: 0,
    success: 0,
    error: 0,
    byMethod: {},
    byRoute: {},
    byStatusCode: {}
  };
  
  performanceStats.responseTime = {
    total: 0,
    count: 0,
    min: Infinity,
    max: 0,
    avg: 0,
    percentiles: { p50: 0, p90: 0, p95: 0, p99: 0 }
  };
  
  performanceStats.errors = {
    total: 0,
    byType: {},
    recent: []
  };
  
  responseTimeHistory.length = 0;
};

// 定期记录性能统计（每5分钟）
setInterval(() => {
  const stats = getPerformanceStats();
  logger.info('性能统计报告', {
    requests: stats.requests,
    responseTime: stats.responseTime,
    memory: stats.memory,
    system: stats.system,
    errors: {
      total: stats.errors.total,
      byType: stats.errors.byType
    }
  });
}, 5 * 60 * 1000);

module.exports = {
  performanceMonitor,
  getPerformanceStats,
  resetStats
};
