// 引入Express框架，用于创建路由器
const express = require('express');
// 创建Express路由器实例，专门处理用户端API路由
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
// 用户端API根路由处理函数，返回API服务状态和可用端点信息
router.get('/', function(req, res) {
  // 使用统一的成功响应方法返回用户端API信息
  res.sendSuccess('用户端API服务正常', {
    data: {
      type: 'user',  // API类型标识
      description: '用户端接口，提供用户相关功能',  // API描述
      // 列出所有可用的用户端API端点
      availableEndpoints: [
        '/api/user/auth',     // 用户认证相关接口
        '/api/user/profile'   // 用户资料相关接口
      ]
    }
  });
});

// 从中间件模块引入用户端专用中间件
const { userApi } = require('../../middleware');

// 将用户端基础中间件应用到所有子路由，包括认证、权限验证等
router.use(userApi);

// 引入用户端子路由模块
const authRouter = require('./auth');        // 用户认证路由
const profileRouter = require('./profile');  // 用户资料路由

// 注册子路由到对应的路径
router.use('/auth', authRouter);      // 注册认证路由，路径为/api/user/auth
router.use('/profile', profileRouter); // 注册资料路由，路径为/api/user/profile

// 导出路由器，供上级路由使用
module.exports = router;
