const jwt = require('jsonwebtoken');
const { userModel } = require('../models');
// 验证JWT token
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// 验证管理员权限的中间件
const validateAdmin = async (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证token'
      });
    }

    // 验证token
    const decoded = verifyToken(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded) {
      return res.status(401).json({
        code: 401,
        message: 'token无效或已过期'
      });
    }

    // 查找用户并验证是否为管理员
    const user = await userModel.findByPk(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '没有管理员权限'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  validateAdmin
}; 