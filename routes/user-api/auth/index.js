const express = require('express');
const router = express.Router();
const { userApiMiddleware } = require('../../../middleware/userApi');

/**
 * @swagger
 * tags:
 *   name: User Auth
 *   description: 用户端认证接口
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: 用户名或邮箱
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           description: 密码
 *           example: "password123"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "登录成功"
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT访问令牌
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: "user123"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 */

/**
 * @swagger
 * /api/user/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户端登录接口，验证用户凭据并返回访问令牌
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 认证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', function(req, res) {
  // TODO: 实现用户登录逻辑
  res.sendSuccess('用户端登录接口', {
    data: {
      message: '此接口待实现',
      type: 'user-login',
      endpoint: '/api/user/auth/login'
    }
  });
});

/**
 * @swagger
 * /api/user/auth/logout:
 *   post:
 *     summary: 用户登出
 *     description: 用户端登出接口，使当前访问令牌失效
 *     tags: [User Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', userApiMiddleware.authenticated, function(req, res) {
  // TODO: 实现用户登出逻辑
  res.sendSuccess('用户端登出接口', {
    data: {
      message: '此接口待实现',
      type: 'user-logout',
      endpoint: '/api/user/auth/logout',
      user: req.user ? { id: req.user.id, username: req.user.username } : null
    }
  });
});

/**
 * @swagger
 * /api/user/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     description: 使用刷新令牌获取新的访问令牌
 *     tags: [User Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 令牌刷新成功
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
 *                   example: "令牌刷新成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: 新的JWT访问令牌
 *       401:
 *         description: 刷新令牌无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', userApiMiddleware.authenticated, function(req, res) {
  // TODO: 实现令牌刷新逻辑
  res.sendSuccess('用户端令牌刷新接口', {
    data: {
      message: '此接口待实现',
      type: 'user-token-refresh',
      endpoint: '/api/user/auth/refresh',
      user: req.user ? { id: req.user.id, username: req.user.username } : null
    }
  });
});

module.exports = router;
