/**
 * 参数验证中间件
 * 提供基于express-validator的请求参数验证功能
 */
const { validationResult, body, query, param } = require('express-validator');
const { getI18n } = require('../../common/i18n');

/**
 * 处理验证结果的中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 获取第一个错误信息
    const firstError = errors.array()[0];
    const i18n = getI18n();
    
    // 返回带有翻译的错误消息
    return res.sendBadRequest(i18n.t(firstError.msg) || i18n.t('参数验证失败'), {
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: i18n.t(err.msg) || i18n.t('验证失败'),
        value: err.value
      }))
    });
  }
  next();
};

/**
 * 通用字段验证规则
 */
const rules = {
  /**
   * 用户名验证规则
   */
  username: () => body('username')
    .trim()
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 4, max: 20 }).withMessage('用户名长度应为4-20个字符')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
  
  /**
   * 密码验证规则
   */
  password: () => body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6, max: 20 }).withMessage('密码长度应为6-20个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('密码必须包含大小写字母和数字'),
  
  /**
   * 邮箱验证规则
   */
  email: () => body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('邮箱格式不正确'),
  
  /**
   * ID参数验证
   */
  id: () => param('id')
    .isInt({ min: 1 }).withMessage('ID必须是正整数'),
  
  /**
   * 分页参数验证
   */
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
  ]
};

/**
 * 构建验证器
 * @param {Array} validations - 验证规则数组
 * @returns {Array} - 中间件数组
 */
const validate = (validations) => {
  return [...validations, handleValidationResult];
};

module.exports = {
  validate,
  rules
}; 