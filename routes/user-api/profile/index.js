// 引入Express框架，用于创建路由器
const express = require('express');
// 创建Express路由器实例，专门处理用户个人资料相关的路由
const router = express.Router();
// 从中间件模块引入预定义的中间件堆栈，用于认证和权限验证
const { stacks } = require('../../../middleware');
// 从控制器模块引入用户个人资料控制器类
const { UserProfileController } = require('../../../controllers');

// 创建用户个人资料控制器实例，用于处理具体的资料管理业务逻辑
const userProfileController = new UserProfileController();

/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: 用户端个人资料管理接口
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 用户ID
 *           example: 1
 *         username:
 *           type: string
 *           description: 用户名
 *           example: "user123"
 *         email:
 *           type: string
 *           description: 邮箱地址
 *           example: "user@example.com"
 *         nickname:
 *           type: string
 *           description: 昵称
 *           example: "小明"
 *         avatar:
 *           type: string
 *           description: 头像URL
 *           example: "https://example.com/avatar.jpg"
 *         phone:
 *           type: string
 *           description: 手机号码
 *           example: "13800138000"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 注册时间
 *         last_login:
 *           type: string
 *           format: date-time
 *           description: 最后登录时间
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: 获取个人资料
 *     description: 获取当前登录用户的个人资料信息
 *     tags: [User Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取个人资料
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
 *                   example: "获取个人资料成功"
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 获取个人资料路由：需要用户认证，返回当前登录用户的完整个人资料信息
router.get('/', stacks.user.authenticated, userProfileController.getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: 更新个人资料
 *     description: 更新当前登录用户的个人资料信息
 *     tags: [User Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: 昵称
 *                 example: "新昵称"
 *               phone:
 *                 type: string
 *                 description: 手机号码
 *                 example: "13800138001"
 *               avatar:
 *                 type: string
 *                 description: 头像URL
 *                 example: "https://example.com/new-avatar.jpg"
 *     responses:
 *       200:
 *         description: 更新成功
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
 *                   example: "个人资料更新成功"
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 更新个人资料路由：需要用户认证，允许用户修改昵称、手机号、头像等信息
router.put('/', stacks.user.authenticated, userProfileController.updateProfile);

/**
 * @swagger
 * /api/user/profile/password:
 *   put:
 *     summary: 修改密码
 *     description: 修改当前登录用户的密码
 *     tags: [User Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 当前密码
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *                 example: "newpassword123"
 *               confirmPassword:
 *                 type: string
 *                 description: 确认新密码
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: 密码修改成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: 请求参数错误或密码不匹配
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 当前密码错误或未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 上传头像路由：需要用户认证，处理用户头像文件上传
router.post('/avatar', stacks.user.authenticated, userProfileController.uploadAvatar);
// 获取用户统计信息路由：需要用户认证，返回用户的活动统计数据
router.get('/stats', stacks.user.authenticated, userProfileController.getStats);
// 获取资料完整度路由：需要用户认证，返回用户资料的完整度百分比
router.get('/completeness', stacks.user.authenticated, userProfileController.getProfileCompleteness);
// 检查用户名可用性路由：无需认证，用于注册时验证用户名是否已被使用
router.get('/check-username/:username', userProfileController.checkUsername);
// 获取用户基本信息路由：无需认证，返回指定用户的公开基本信息
router.get('/:userId', userProfileController.getUserBasicInfo);

// 导出路由器，供上级路由使用
module.exports = router;
