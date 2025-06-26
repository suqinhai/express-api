const express = require('express');
const router = express.Router();

// 引入用户端和管理端路由
const userRouter = require('./user-api');
const adminRouter = require('./admin-api');

// 注册子路由
router.use('/user', userRouter);
router.use('/admin', adminRouter);

module.exports = router;