const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User API
 *   description: 用户端接口 - 面向普通用户的功能接口
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: 用户端API信息
 *     description: 返回用户端可用的API信息
 *     tags: [User API]
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
 *                   example: 用户端API服务正常
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "user"
 *                     description:
 *                       type: string
 *                       example: "用户端接口，提供用户相关功能"
 *                     availableEndpoints:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["/api/user/auth", "/api/user/profile"]
 */
router.get('/', function(req, res) {
  res.sendSuccess('用户端API服务正常', {
    data: {
      type: 'user',
      description: '用户端接口，提供用户相关功能',
      availableEndpoints: [
        '/api/user/auth',
        '/api/user/profile'
      ]
    }
  });
});

// 引入用户端专用中间件
const { userApiMiddleware } = require('../../middleware/userApi');

// 应用用户端基础中间件到所有路由
router.use(userApiMiddleware.base);

// 引入用户端子路由模块
const authRouter = require('./auth');
const profileRouter = require('./profile');

// 注册子路由
router.use('/auth', authRouter);
router.use('/profile', profileRouter);

module.exports = router;
