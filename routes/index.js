var express = require('express');
var router = express.Router();
var healthCheck = require('../common/healthcheck');
var { cache } = require('../middleware');

/**
 * @swagger
 * tags:
 *   - name: API基础
 *     description: API基本信息和健康检查
 *   - name: Authentication
 *     description: 用户认证相关接口
 *   - name: Users
 *     description: 用户管理相关接口
 *   - name: Cache
 *     description: 缓存演示接口
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: API欢迎信息
 *     description: 返回API欢迎信息和状态
 *     tags: [API基础]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: Express API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 status:
 *                   type: string
 *                   example: active
 */
router.get('/', function(req, res) {
  res.json({
    title: 'Express API',
    version: '1.0.0',
    status: 'active'
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查API服务各组件（数据库、缓存、系统资源）的健康状态
 *     tags: [API基础]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full, db, cache, system]
 *         description: 指定要检查的组件类型 (默认为full)
 *     responses:
 *       200:
 *         description: 服务健康状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok, warning, degraded, error]
 *                   description: 服务健康状态
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   description: 时间戳
 *                   example: "2023-01-01T12:00:00Z"
 *                 uptime:
 *                   type: number
 *                   description: 服务运行时间（秒）
 *                   example: 1234.56
 *                 components:
 *                   type: object
 *                   description: 各组件的健康状态
 */
router.get('/health', async function(req, res) {
  try {
    const type = req.query.type || 'full';
    let result;
    
    switch (type) {
      case 'db':
        result = await healthCheck.checkDatabase();
        break;
      case 'cache':
        result = await healthCheck.checkCache();
        break;
      case 'system':
        result = await healthCheck.checkSystem();
        break;
      case 'full':
      default:
        result = await healthCheck.checkAll();
    }
    
    // 根据健康状态设置HTTP状态码
    const httpStatus = result.status === 'ok' ? 200 :
                      result.status === 'warning' ? 200 :
                      result.status === 'degraded' ? 207 : 
                      503; // 服务不可用
    
    res.status(httpStatus).json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /cache-demo:
 *   get:
 *     summary: 缓存演示接口
 *     description: 演示响应缓存功能，首次请求会延迟2秒，后续请求会直接从缓存返回
 *     tags: [Cache]
 *     parameters:
 *       - in: query
 *         name: nocache
 *         schema:
 *           type: boolean
 *         description: 设置为true跳过缓存（默认false）
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 缓存演示数据
 *                 timestamp:
 *                   type: string
 *                   description: 时间戳
 *                   example: "2023-01-01T12:00:00Z"
 *                 cached:
 *                   type: boolean
 *                   description: 是否来自缓存
 *                   example: true
 */
router.get('/cache-demo', cache.routeCache({
  ttl: 60, // 缓存60秒
  prefix: 'api:demo'
}), function(req, res) {
  // 如果请求参数包含nocache=true，则跳过缓存
  if (req.query.nocache === 'true') {
    res.set('X-Cache', 'BYPASS');
  }
  
  // 模拟耗时操作（2秒延迟）
  setTimeout(() => {
    const now = new Date();
    
    res.json({
      message: '缓存演示数据',
      timestamp: now.toISOString(),
      cached: res.get('X-Cache') === 'HIT',
      serverTime: now.toLocaleTimeString()
    });
  }, 2000);
});

/**
 * @swagger
 * /cache-demo/clear:
 *   post:
 *     summary: 清除缓存演示
 *     description: 清除缓存演示接口的缓存数据
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 缓存已清除
 */
router.post('/cache-demo/clear', cache.clearRouteCache({
  prefix: 'api:demo'
}), function(req, res) {
  res.json({
    success: true,
    message: '缓存已清除',
    timestamp: new Date().toISOString()
  });
});

var userRouter = require('./users');

router.use('/users', userRouter);

module.exports = router;
