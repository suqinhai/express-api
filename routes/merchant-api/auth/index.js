// 引入Express框架，用于创建路由器
const express = require('express');
// 创建Express路由器实例，专门处理商户认证相关的路由
const router = express.Router();
// 从中间件模块引入预定义的中间件堆栈，用于认证和权限验证
const { stacks } = require('../../../middleware');
// 从控制器模块引入商户认证控制器类
const { MerchantAuthController } = require('../../../controllers');

// 创建商户认证控制器实例，用于处理具体的认证业务逻辑
const merchantAuthController = new MerchantAuthController();

/**
 * @swagger
 * tags:
 *   name: Merchant Auth
 *   description: 商户端认证接口
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MerchantLoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: 商户用户名或邮箱
 *           example: "merchant@example.com"
 *         password:
 *           type: string
 *           description: 密码
 *           example: "password123"
 *     MerchantLoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "商户登录成功"
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT访问令牌
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             merchant:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: "merchant123"
 *                 email:
 *                   type: string
 *                   example: "merchant@example.com"
 *                 merchantId:
 *                   type: integer
 *                   example: 100
 *                 shopIds:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [1, 2, 3]
 */

/**
 * @swagger
 * /api/merchant/auth/login:
 *   post:
 *     summary: 商户登录
 *     description: 商户端登录接口，验证商户凭据并返回访问令牌
 *     tags: [Merchant Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MerchantLoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MerchantLoginResponse'
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
// 商户登录路由：处理商户登录请求，验证凭据并返回JWT令牌
router.post('/login', stacks.merchant.login, merchantAuthController.login);

/**
 * @swagger
 * /api/merchant/auth/logout:
 *   post:
 *     summary: 商户登出
 *     description: 商户端登出接口，使当前访问令牌失效
 *     tags: [Merchant Auth]
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
// 商户登出路由：需要认证中间件验证，处理商户登出并使令牌失效
router.post('/logout', stacks.merchant.authenticated, merchantAuthController.logout);

/**
 * @swagger
 * /api/merchant/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     description: 使用刷新令牌获取新的访问令牌
 *     tags: [Merchant Auth]
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
// 刷新令牌路由：使用刷新令牌获取新的访问令牌，延长商户会话
router.post('/refresh', merchantAuthController.refreshToken);

// 商户注册路由：处理新商户注册请求，创建商户账户
router.post('/register', stacks.merchant.public, merchantAuthController.register);

// 获取当前商户信息路由：需要认证，返回当前登录商户的详细信息
router.get('/me', stacks.merchant.authenticated, merchantAuthController.getCurrentMerchant);

// 修改密码路由：需要认证，允许商户修改自己的登录密码
router.put('/password', stacks.merchant.authenticated, merchantAuthController.changePassword);

// 验证令牌路由：验证JWT令牌的有效性，用于客户端令牌状态检查
router.get('/verify', merchantAuthController.verifyToken);

// 导出路由器，供上级路由使用
module.exports = router;
