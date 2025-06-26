const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin API
 *   description: 管理后台接口 - 面向管理员的管理功能接口
 */

/**
 * @swagger
 * /api/admin:
 *   get:
 *     summary: 管理端API信息
 *     description: 返回管理端可用的API信息
 *     tags: [Admin API]
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
 *                   example: 管理端API服务正常
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "admin"
 *                     description:
 *                       type: string
 *                       example: "管理端接口，提供系统管理功能"
 *                     availableEndpoints:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["/api/admin/users", "/api/admin/system"]
 */
router.get('/', function(req, res) {
  res.sendSuccess('管理端API服务正常', {
    data: {
      type: 'admin',
      description: '管理端接口，提供系统管理功能',
      availableEndpoints: [
        '/api/admin/users',
        '/api/admin/system'
      ]
    }
  });
});

// 引入管理端专用中间件
const { adminApiMiddleware } = require('../../middleware/adminApi');

// 应用管理端基础中间件到所有路由
router.use(adminApiMiddleware.base);

// 引入管理端子路由模块
const usersRouter = require('./users');
const systemRouter = require('./system');

// 注册子路由
router.use('/users', usersRouter);
router.use('/system', systemRouter);

module.exports = router;
