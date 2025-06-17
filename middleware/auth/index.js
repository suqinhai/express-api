const jwt = require('jsonwebtoken');
const { userModel } = require('../../models');
const CacheManager = require('../../common/redis/cache');
const { PREFIX, TTL } = require('../../common/redis');
const { sendUnauthorized } = require('../../common/routeHandler');

/**
 * 验证JWT token
 * @param {string} token - JWT令牌
 * @param {string} secret - JWT密钥
 * @returns {Object|null} - 解析后的token数据或null
 */
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

/**
 * 从数据库获取用户信息
 * @param {number} userId - 用户ID
 * @returns {Promise<Object|null>} - 用户对象或null
 */
async function getUserById(userId) {
  try {
    return await userModel.findByPk(userId);
  } catch (error) {
    console.error(`通过ID获取用户失败: ${userId}`, error);
    return null;
  }
}

/**
 * 验证用户权限的中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 * @returns {Promise<void>}
 */
const validateUser = async (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.sendUnauthorized('未提供认证token');
    }

    // 检查token缓存
    const tokenKey = `auth:${token.substring(0, 10)}`;
    const cachedTokenData = await CacheManager.get(PREFIX.TOKEN, tokenKey);

    let decoded;
    if (cachedTokenData) {
      // 使用缓存中的token数据
      decoded = cachedTokenData;
    } else {
      // 验证token
      decoded = verifyToken(token, process.env.JWT_SECRET);
      if (!decoded) {
        return res.sendUnauthorized('token无效或已过期');
      }
      
      // 缓存token解析结果，使用较短的缓存时间
      await CacheManager.set(PREFIX.TOKEN, tokenKey, decoded, TTL.SHORT);
    }

    // 使用缓存获取用户信息
    const user = await CacheManager.getOrFetch(
      PREFIX.USER,
      decoded.id,
      () => getUserById(decoded.id),
      TTL.MEDIUM
    );

    // 用户不存在
    if (!user) {
      return res.sendBadRequest('用户不存在');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.sendUnauthorized('用户状态异常');
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error('验证用户权限失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 验证管理员权限的中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 * @returns {Promise<void>}
 */
const validateAdmin = async (req, res, next) => {
  try {
    // 先验证用户身份
    await validateUser(req, res, async () => {
      // 验证管理员权限
      if (req.user.role !== 'admin') {
        return res.sendUnauthorized('权限不足，需要管理员权限');
      }
      
      next();
    });
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  validateUser,
  validateAdmin
}; 