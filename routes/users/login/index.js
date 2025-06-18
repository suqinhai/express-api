const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../../../common');
const CacheManager = require('../../../common/redis/cache');
const { PREFIX, TTL } = require('../../../common/redis');
const { loginLimiter } = require('../../../middleware');
const { validate, rules } = require('../../../middleware/validator');
const { body } = require('express-validator');

// 引入用户模型
const { userModel } = require('../../../models');

/**
 * 获取用户信息并缓存
 * @param {Object} sequelize - Sequelize实例
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>} - 用户信息或null
 */
async function getUserByUsername(sequelize, username) {
  try {
    // 初始化用户模型
    const User = userModel(sequelize);

    return await User.findOne({
      where: { username: username }
    });
  } catch (error) {
    console.error(`获取用户信息失败: ${username}`, error);
    return null;
  }
}

/**
 * 缓存用户登录token
 * @param {string} userId - 用户ID
 * @param {string} token - JWT令牌
 * @returns {Promise<boolean>} - 是否缓存成功
 */
async function cacheUserToken(userId, token) {
  try {
    // 缓存用户token，过期时间与JWT一致（24小时）
    return await CacheManager.set(PREFIX.TOKEN, userId, { token }, TTL.LONG);
  } catch (error) {
    console.error(`缓存用户token失败: ${userId}`, error);
    return false;
  }
}

/**
 * 缓存用户信息
 * @param {Object} user - 用户对象
 * @returns {Promise<boolean>} - 是否缓存成功
 */
async function cacheUserInfo(user) {
  if (!user || !user.id) return false;

  try {
    // 创建不包含密码的用户信息
    const userInfo = {
      ...user
    };
    delete userInfo.password;

    // 缓存用户信息，使用中等时长缓存
    return await CacheManager.set(PREFIX.USER, user.id, userInfo, TTL.MEDIUM);
  } catch (error) {
    console.error(`缓存用户信息失败: ${user.id}`, error);
    return false;
  }
}

/**
 * 登录验证规则
 */
const loginValidationRules = [
  rules.username(),
  rules.password(),
  // 防止XSS攻击的额外验证
  body('username').escape(),
  
  // 记住我选项验证
  body('remember_me')
    .optional()
    .isBoolean()
    .withMessage('记住我选项必须是布尔值'),
  
  // 验证码验证（如果前端需要）
  body('captcha')
    .optional()
    .isString()
    .withMessage('验证码格式不正确'),
  
  // 设备信息验证
  body('device_info')
    .optional()
    .isObject()
    .withMessage('设备信息必须是对象')
];

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 用户认证相关接口
 * 
 * /users/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户使用用户名和密码登录系统
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: 用户密码
 *                 format: password
 *                 example: "Password123"
 *               remember_me:
 *                 type: boolean
 *                 description: 记住我选项
 *                 example: false
 *               captcha:
 *                 type: string
 *                 description: 验证码(如需)
 *                 example: "a1b2c3"
 *               device_info:
 *                 type: object
 *                 description: 设备信息
 *                 example: { "device": "web", "browser": "chrome" }
 *     responses:
 *       200:
 *         description: 登录成功
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
 *                   example: "登录成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT令牌
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: 用户ID
 *                           example: 1
 *                         username:
 *                           type: string
 *                           description: 用户名
 *                           example: "admin"
 *                         email:
 *                           type: string
 *                           description: 邮箱地址
 *                           example: "admin@example.com"
 *                         status:
 *                           type: string
 *                           description: 用户状态
 *                           example: "active"
 *                         last_login:
 *                           type: string
 *                           format: date-time
 *                           description: 上次登录时间
 *                           example: "2023-01-01T00:00:00Z"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 用户名或密码错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: 请求次数过多，需要稍后重试
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * 用户登录接口
 * @route POST /user/login
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {boolean} remember_me - 记住我选项（可选）
 * @param {string} captcha - 验证码（可选）
 * @param {Object} device_info - 设备信息（可选）
 * @returns {object} 200 - 登录成功，返回token
 * @returns {Error} 400 - 参数错误
 * @returns {Error} 401 - 用户名或密码错误
 * @returns {Error} 500 - 服务器错误
 */
router.post('/', 
  loginLimiter, 
  validate(loginValidationRules),
  asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // 获取数据库连接
  const sequelize = res.sequelize;

  // 使用缓存机制获取用户信息
  const user = await CacheManager.getOrFetch(
    PREFIX.USER,
    `by-username:${username}`,
    () => getUserByUsername(sequelize, username),
    TTL.SHORT // 短时间缓存用户名查询结果
  );

  // 用户不存在
  if (!user) {
    return res.sendUnauthorized('用户名或密码错误');
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.sendUnauthorized('用户名或密码错误');
  }

  // 更新最后登录时间
  await user.update({
    last_login: new Date()
  });

  // 生成JWT令牌
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // 缓存用户token和信息
  await Promise.all([
    cacheUserToken(user.id, token),
    cacheUserInfo(user)
  ]);

  // 删除根据用户名查找用户的缓存，确保用户信息更新
  await CacheManager.delete(PREFIX.USER, `by-username:${username}`);

  // 返回成功响应
  return res.sendSuccess('登录成功', {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
      last_login: user.last_login
    }
  });
}));

module.exports = router;
