const express = require('express');
const router = express.Router();
const { userApiMiddleware } = require('../../../middleware/userApi');

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
router.get('/', userApiMiddleware.authenticated, async function(req, res) {
  try {
    // 示例实现：获取用户个人资料
    const user = req.user;
    
    // 构建返回的用户资料数据（过滤敏感信息）
    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname || user.username,
      avatar: user.avatar || null,
      phone: user.phone || null,
      status: user.status,
      created_at: user.created_at || user.createdAt,
      last_login: user.last_login || user.lastLogin || user.updatedAt
    };
    
    res.sendSuccess('获取个人资料成功', {
      data: userProfile
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    res.status(500).json({
      success: false,
      message: '获取个人资料失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    });
  }
});

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
router.put('/', userApiMiddleware.authenticated, function(req, res) {
  // TODO: 实现更新用户个人资料逻辑
  res.sendSuccess('个人资料更新成功', {
    data: {
      message: '此接口待实现',
      type: 'user-profile-update',
      endpoint: '/api/user/profile',
      user: req.user ? { id: req.user.id, username: req.user.username } : null,
      updateData: req.body
    }
  });
});

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
router.put('/password', userApiMiddleware.authenticated, function(req, res) {
  // TODO: 实现修改密码逻辑
  res.sendSuccess('密码修改成功', {
    data: {
      message: '此接口待实现',
      type: 'user-password-change',
      endpoint: '/api/user/profile/password',
      user: req.user ? { id: req.user.id, username: req.user.username } : null
    }
  });
});

module.exports = router;
