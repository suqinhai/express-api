const express = require('express');
const router = express.Router();
const { registerConfigModel } = require('../../../models');
const { validateAdmin } = require('../../../middleware/index');
const { registerLimiter } = require('../../../middleware');
const { validate, rules } = require('../../../middleware/validator');
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
router.post('/config', 
  validateAdmin, 
  asyncHandler(async (req, res) => {
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

/**
 * 用户注册接口
 * @route POST /users/register
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} email - 邮箱
 * @returns {object} 200 - 注册成功
 * @returns {Error} 400 - 参数错误
 * @returns {Error} 409 - 用户名已存在
 * @returns {Error} 500 - 服务器错误
 */
router.post('/', 
  registerLimiter,
  validate([
    rules.username(),
    rules.password(),
    rules.email()
  ]),
  asyncHandler(async (req, res) => {
    // 实际注册逻辑将实现在后续步骤
    return res.sendSuccess('注册功能待实现');
  }));

module.exports = router;
