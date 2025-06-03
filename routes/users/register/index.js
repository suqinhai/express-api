const express = require('express');
const router = express.Router();
const { registerConfigModel } = require('../../../models');
const { validateAdmin } = require('../../../middleware/index');

// 获取注册配置
router.get('/config', async (req, res) => {
  try {
    let config = await registerConfigModel.findOne();
    console.log(config);
    // 如果没有配置记录，创建默认配置
    if (!config) {
      config = await registerConfigModel.create({});
    }
    
    res.json({
      code: 200,
      data: config,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取注册配置失败:', error.message, error.stack, error.original);
    res.status(500).json({
      code: 500,
      message: `获取注册配置失败: ${error.message || 'Undetailed error'}`
    });
  }
});

// 更新注册配置
router.post('/config', validateAdmin, async (req, res) => {
  try {
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

    res.json({
      code: 200,
      data: config,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新注册配置失败:', error.message, error.stack, error.original);
    res.status(500).json({
      code: 500,
      message: `更新注册配置失败: ${error.message || 'Undetailed error'}`
    });
  }
});

module.exports = router;
