const express = require('express');
const router = express.Router();
const { registerConfigModel } = require('../../../models');
const { validateAdmin } = require('../../../middleware/index');
const { asyncHandler } = require('../../../common');
const CacheManager = require('../../../common/redis/cache');
const { PREFIX, TTL } = require('../../../common/redis');

// 配置缓存键
const REGISTER_CONFIG_CACHE_KEY = 'register-config';

/**
 * 获取注册配置并处理缓存
 * @param {Object} model - 注册配置模型
 * @returns {Promise<Object>} - 注册配置
 */
async function getRegisterConfig(model) {
  try {
    let config = await model.findOne();

    // 如果没有配置记录，创建默认配置
    if (!config) {
      config = await model.create({});
    }
    
    return config;
  } catch (error) {
    console.error('获取注册配置失败:', error);
    throw error;
  }
}

// 获取注册配置
router.get('/config', asyncHandler(async (req, res) => {
  // 使用缓存机制获取配置
  const config = await CacheManager.getOrFetch(
    PREFIX.CONFIG,
    REGISTER_CONFIG_CACHE_KEY,
    () => getRegisterConfig(registerConfigModel),
    TTL.MEDIUM // 中等时长缓存
  );

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

  // 更新缓存
  await CacheManager.set(PREFIX.CONFIG, REGISTER_CONFIG_CACHE_KEY, config, TTL.MEDIUM);

  return res.sendSuccess('更新成功', config);
}));

module.exports = router;
