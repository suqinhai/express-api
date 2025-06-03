const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../../../common');

// 引入用户模型
const { userModel } = require('../../../models');

/**
 * 用户登录接口
 * @route POST /user/login
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {object} 200 - 登录成功，返回token
 * @returns {Error} 400 - 参数错误
 * @returns {Error} 401 - 用户名或密码错误
 * @returns {Error} 500 - 服务器错误
 */
router.post('/', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // 参数验证
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: '用户名和密码不能为空' 
    });
  }
  
  // 获取数据库连接
  const sequelize = req.sequelize;
  
  // 初始化用户模型
  const User = userModel(sequelize);
  
  // 查询用户
  const user = await User.findOne({ 
    where: { username: username }
  });
  
  // 用户不存在
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: '用户名或密码错误' 
    });
  }
  
  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return res.status(401).json({ 
      success: false, 
      message: '用户名或密码错误' 
    });
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
  
  // 返回成功响应
  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        last_login: user.last_login
      }
    }
  });
}));

module.exports = router;
