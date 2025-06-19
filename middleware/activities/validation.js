/**
 * 活动相关的验证中间件
 * 使用express-validator进行请求参数验证
 */

const { body, query, param } = require('express-validator');

/**
 * 活动验证规则
 */
const activityValidation = {
  /**
   * 获取活动列表的验证规则
   */
  getActivities: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数'),
    
    query('status')
      .optional()
      .isIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
      .withMessage('活动状态必须是有效值'),
    
    query('type_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('活动类型ID必须是大于0的整数'),
    
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('搜索关键词长度必须在1-100字符之间'),
    
    query('sort')
      .optional()
      .isIn(['id', 'name', 'start_time', 'end_time', 'created_at', 'updated_at', 'priority'])
      .withMessage('排序字段必须是有效值'),
    
    query('order')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('排序方向必须是ASC或DESC')
  ],

  /**
   * 创建活动的验证规则
   */
  createActivity: [
    body('name')
      .notEmpty()
      .withMessage('活动名称不能为空')
      .isLength({ min: 1, max: 255 })
      .withMessage('活动名称长度必须在1-255字符之间'),
    
    body('type_id')
      .notEmpty()
      .withMessage('活动类型ID不能为空')
      .isInt({ min: 1 })
      .withMessage('活动类型ID必须是大于0的整数'),
    
    body('description')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('活动描述长度不能超过5000字符'),
    
    body('start_time')
      .notEmpty()
      .withMessage('活动开始时间不能为空')
      .isISO8601()
      .withMessage('活动开始时间格式无效')
      .custom((value) => {
        const startTime = new Date(value);
        const now = new Date();
        if (startTime <= now) {
          throw new Error('活动开始时间必须晚于当前时间');
        }
        return true;
      }),
    
    body('end_time')
      .notEmpty()
      .withMessage('活动结束时间不能为空')
      .isISO8601()
      .withMessage('活动结束时间格式无效')
      .custom((value, { req }) => {
        const endTime = new Date(value);
        const startTime = new Date(req.body.start_time);
        if (endTime <= startTime) {
          throw new Error('活动结束时间必须晚于开始时间');
        }
        return true;
      }),
    
    body('location')
      .optional()
      .isLength({ max: 255 })
      .withMessage('活动地点长度不能超过255字符'),
    
    body('max_participants')
      .optional()
      .isInt({ min: 1 })
      .withMessage('最大参与人数必须是大于0的整数'),
    
    body('priority')
      .optional()
      .isInt({ min: 0 })
      .withMessage('活动优先级必须是非负整数'),
    
    body('is_public')
      .optional()
      .isBoolean()
      .withMessage('是否公开必须是布尔值'),
    
    body('is_featured')
      .optional()
      .isBoolean()
      .withMessage('是否推荐必须是布尔值'),
    
    body('registration_required')
      .optional()
      .isBoolean()
      .withMessage('是否需要报名必须是布尔值'),
    
    body('registration_deadline')
      .optional()
      .isISO8601()
      .withMessage('报名截止时间格式无效')
      .custom((value, { req }) => {
        if (value && req.body.start_time) {
          const deadline = new Date(value);
          const startTime = new Date(req.body.start_time);
          if (deadline >= startTime) {
            throw new Error('报名截止时间必须早于活动开始时间');
          }
        }
        return true;
      }),
    
    body('organizer_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('组织者ID必须是大于0的整数'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('标签必须是数组格式'),
    
    body('tags.*')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('每个标签长度必须在1-50字符之间'),
    
    body('banner_image')
      .optional()
      .isURL()
      .withMessage('横幅图片必须是有效的URL'),
    
    body('thumbnail_image')
      .optional()
      .isURL()
      .withMessage('缩略图必须是有效的URL')
  ],

  /**
   * 更新活动的验证规则
   */
  updateActivity: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('活动ID必须是大于0的整数'),
    
    body('name')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('活动名称长度必须在1-255字符之间'),
    
    body('type_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('活动类型ID必须是大于0的整数'),
    
    body('description')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('活动描述长度不能超过5000字符'),
    
    body('start_time')
      .optional()
      .isISO8601()
      .withMessage('活动开始时间格式无效'),
    
    body('end_time')
      .optional()
      .isISO8601()
      .withMessage('活动结束时间格式无效'),
    
    body('location')
      .optional()
      .isLength({ max: 255 })
      .withMessage('活动地点长度不能超过255字符'),
    
    body('max_participants')
      .optional()
      .isInt({ min: 1 })
      .withMessage('最大参与人数必须是大于0的整数'),
    
    body('priority')
      .optional()
      .isInt({ min: 0 })
      .withMessage('活动优先级必须是非负整数'),
    
    body('is_public')
      .optional()
      .isBoolean()
      .withMessage('是否公开必须是布尔值'),
    
    body('is_featured')
      .optional()
      .isBoolean()
      .withMessage('是否推荐必须是布尔值'),
    
    body('registration_required')
      .optional()
      .isBoolean()
      .withMessage('是否需要报名必须是布尔值'),
    
    body('registration_deadline')
      .optional()
      .isISO8601()
      .withMessage('报名截止时间格式无效'),
    
    body('organizer_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('组织者ID必须是大于0的整数'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('标签必须是数组格式'),
    
    body('tags.*')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('每个标签长度必须在1-50字符之间'),
    
    body('banner_image')
      .optional()
      .isURL()
      .withMessage('横幅图片必须是有效的URL'),
    
    body('thumbnail_image')
      .optional()
      .isURL()
      .withMessage('缩略图必须是有效的URL')
  ],

  /**
   * 更新活动状态的验证规则
   */
  updateActivityStatus: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('活动ID必须是大于0的整数'),
    
    body('status')
      .notEmpty()
      .withMessage('活动状态不能为空')
      .isIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
      .withMessage('活动状态必须是有效值')
  ],

  /**
   * 批量更新状态的验证规则
   */
  batchUpdateStatus: [
    body('activity_ids')
      .notEmpty()
      .withMessage('活动ID列表不能为空')
      .isArray({ min: 1, max: 100 })
      .withMessage('活动ID列表必须是包含1-100个元素的数组'),
    
    body('activity_ids.*')
      .isInt({ min: 1 })
      .withMessage('每个活动ID必须是大于0的整数'),
    
    body('status')
      .notEmpty()
      .withMessage('活动状态不能为空')
      .isIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
      .withMessage('活动状态必须是有效值')
  ],

  /**
   * 活动类型验证规则
   */
  createActivityType: [
    body('name')
      .notEmpty()
      .withMessage('活动类型名称不能为空')
      .isLength({ min: 1, max: 100 })
      .withMessage('活动类型名称长度必须在1-100字符之间'),
    
    body('code')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('活动类型代码长度必须在1-50字符之间')
      .matches(/^[a-z0-9_]+$/)
      .withMessage('活动类型代码只能包含小写字母、数字和下划线'),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('活动类型描述长度不能超过1000字符'),
    
    body('icon')
      .optional()
      .isLength({ max: 255 })
      .withMessage('图标长度不能超过255字符'),
    
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('颜色必须是有效的十六进制颜色值'),
    
    body('sort_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('排序顺序必须是非负整数'),
    
    body('default_duration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('默认持续时间必须是大于0的整数（分钟）'),
    
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('是否启用必须是布尔值')
  ],

  /**
   * 通用ID参数验证
   */
  validateId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID必须是大于0的整数')
  ]
};

module.exports = {
  activityValidation
};
