const express = require('express');
const router = express.Router();
const { registerConfigModel } = require('../../../models');
const { validateAdmin } = require('../../../middleware/index');
const { registerLimiter } = require('../../../middleware');
const { validate, rules } = require('../../../middleware/validator');
const { asyncHandler } = require('../../../common');
const CacheManager = require('../../../common/redis/cache');
const { PREFIX, TTL } = require('../../../common/redis');
const { body } = require('express-validator');

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

/**
 * 配置验证规则
 */
const configValidationRules = [
  // 实名验证配置
  body('realNameVerification')
    .optional()
    .isBoolean()
    .withMessage('实名验证配置必须是布尔值'),
  
  body('realNameRequired')
    .optional()
    .isBoolean()
    .withMessage('实名验证必要性配置必须是布尔值'),
  
  // 手机验证配置
  body('phoneVerification')
    .optional()
    .isBoolean()
    .withMessage('手机验证配置必须是布尔值'),
  
  body('phoneRequired')
    .optional()
    .isBoolean()
    .withMessage('手机验证必要性配置必须是布尔值'),
  
  body('phoneVerificationCode')
    .optional()
    .isBoolean()
    .withMessage('手机验证码配置必须是布尔值'),
  
  // 其他配置
  body('captchaType')
    .optional()
    .isIn(['none', 'image', 'recaptcha', 'hcaptcha', 'turnstile'])
    .withMessage('验证码类型不合法'),
  
  // 社交媒体登录配置
  body('googleAuthEnabled')
    .optional()
    .isBoolean()
    .withMessage('谷歌登录配置必须是布尔值'),
  
  body('facebookAuthEnabled')
    .optional()
    .isBoolean()
    .withMessage('脸书登录配置必须是布尔值')
];

/**
 * 用户注册验证规则
 */
const registerValidationRules = [
  // 基本字段验证
  rules.username(),
  rules.password(),
  rules.email(),
  
  // 防止XSS攻击
  body(['username', 'email']).escape(),
  
  // 密码确认验证
  body('confirmPassword')
    .notEmpty().withMessage('确认密码不能为空')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('确认密码与密码不匹配');
      }
      return true;
    }),
  
  // 协议同意验证
  body('agreement')
    .isBoolean()
    .custom(value => {
      if (value !== true) {
        throw new Error('必须同意用户协议');
      }
      return true;
    })
    .withMessage('必须同意用户协议'),
  
  // 验证码验证
  body('captcha')
    .optional()
    .isString()
    .withMessage('验证码格式不正确'),
  
  // 手机号验证(可选)
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('手机号格式不正确'),
  
  // 邀请码验证(可选)
  body('inviteCode')
    .optional()
    .isString()
    .isLength({ min: 6, max: 20 })
    .withMessage('邀请码格式不正确')
];

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
  validate(configValidationRules),
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
 * @param {string} confirmPassword - 确认密码
 * @param {string} email - 邮箱
 * @param {boolean} agreement - 同意用户协议
 * @param {string} captcha - 验证码（可选）
 * @param {string} phone - 手机号码（可选）
 * @param {string} inviteCode - 邀请码（可选）
 * @returns {object} 200 - 注册成功
 * @returns {Error} 400 - 参数错误
 * @returns {Error} 409 - 用户名已存在
 * @returns {Error} 500 - 服务器错误
 */
router.post('/', 
  registerLimiter,
  validate(registerValidationRules),
  asyncHandler(async (req, res) => {
    // 实际注册逻辑将实现在后续步骤
    return res.sendSuccess('注册功能待实现');
  }));

module.exports = router;
