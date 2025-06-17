const express = require('express');
const router = express.Router();
const { registerConfigModel } = require('../../../models');
const { validateAdmin } = require('../../../middleware/index');
const { asyncHandler } = require('../../../common');

// 获取注册配置
router.get('/config', asyncHandler(async (req, res) => {
  let config = await registerConfigModel.findOne();

  // 如果没有配置记录，创建默认配置
  if (!config) {
    config = await registerConfigModel.create({});
  }

  return res.sendSuccess('获取成功', config);
}));

// 更新注册配置
router.post('/config', validateAdmin, asyncHandler(async (req, res) => {
  const {
    realNameVerification,
    realNameRequired,
    phoneVerification,
    phoneRequired,
    phoneVerificationCode,
    captchaType,
    googleAuthEnabled,
    googleAppId,
    googleSecret,
    facebookAuthEnabled,
    facebookAppId,
    facebookSecret
  } = req.body;

  let config = await registerConfigModel.findOne();

  // 如果没有配置记录，创建一个新的
  if (!config) {
    config = await registerConfigModel.create({});
  }

  // 更新配置
  await config.update({
    realNameVerification,
    realNameRequired,
    phoneVerification,
    phoneRequired,
    phoneVerificationCode,
    captchaType,
    googleAuthEnabled,
    googleAppId,
    googleSecret,
    facebookAuthEnabled,
    facebookAppId,
    facebookSecret,
    updated_at: new Date()
  });

  // 重新获取更新后的配置
  config = await registerConfigModel.findOne({
    where: { id: config.id }
  });

  return res.sendSuccess('更新成功', config);
}));

module.exports = router;
