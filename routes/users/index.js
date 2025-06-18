const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 用户管理API
 * 
 * components:
 *   schemas:
 *     User:
 *       $ref: '#/components/schemas/User'
 */

// 引入登录路由
const loginRouter = require('./login');
const registerRouter = require('./register');
const cachedRouter = require('./cached');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: 获取当前用户信息
 *     description: 获取当前已认证用户的详细信息
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回用户信息
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
 *                   example: "获取用户信息成功"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 这是获取当前用户信息的路由占位符 - 在实际实现时添加
// router.get('/', authMiddleware, asyncHandler(async (req, res) => { ... }));

// 注册登录路由
router.use('/login', loginRouter);
router.use('/register', registerRouter);
router.use('/cached', cachedRouter);
// 可以在这里添加其他用户相关路由，如注册、个人信息等

module.exports = router;