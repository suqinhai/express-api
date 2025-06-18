var express = require('express');
var router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: API基础
 *     description: API基本信息和健康检查
 *   - name: Authentication
 *     description: 用户认证相关接口
 *   - name: Users
 *     description: 用户管理相关接口
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
 *     description: 检查API服务是否正常运行
 *     tags: [API基础]
 *     responses:
 *       200:
 *         description: 服务正常运行
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   example: "2023-01-01T12:00:00Z"
 */
router.get('/health', function(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

var userRouter = require('./users');

router.use('/users', userRouter);

module.exports = router;
