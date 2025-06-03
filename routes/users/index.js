const express = require('express');
const router = express.Router();

// 引入登录路由
const loginRouter = require('./login');
const registerRouter = require('./register');

// 注册登录路由
router.use('/login', loginRouter);
router.use('/register', registerRouter);
// 可以在这里添加其他用户相关路由，如注册、个人信息等

module.exports = router;