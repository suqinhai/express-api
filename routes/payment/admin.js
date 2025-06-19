const express = require('express');
const router = express.Router();
const PaymentAdminController = require('../../controllers/PaymentAdminController');
const { body, param, query, validationResult } = require('express-validator');
const { logger } = require('../../common/logger');

// 创建管理控制器实例
const adminController = new PaymentAdminController();

/**
 * 验证中间件
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   - name: PaymentAdmin
 *     description: 支付管理接口
 */

// ==================== 支付渠道管理 ====================

/**
 * @swagger
 * /api/payment/admin/channels:
 *   get:
 *     summary: 获取支付渠道列表
 *     tags: [PaymentAdmin]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *         description: 渠道状态筛选
 *       - in: query
 *         name: plugin_id
 *         schema:
 *           type: integer
 *         description: 插件ID筛选
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/channels', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      plugin_id: req.query.plugin_id ? parseInt(req.query.plugin_id) : undefined
    };
    
    const channels = await adminController.getChannels(filters);
    
    res.json({
      success: true,
      message: '获取成功',
      data: channels
    });
  } catch (error) {
    logger.error('获取支付渠道列表失败', { 
      category: 'PAYMENT_ADMIN_API', 
      error 
    });
    res.status(500).json({
      success: false,
      message: error.message || '获取支付渠道列表失败'
    });
  }
});

/**
 * @swagger
 * /api/payment/admin/channels:
 *   post:
 *     summary: 创建支付渠道
 *     tags: [PaymentAdmin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel_code
 *               - channel_name
 *               - plugin_id
 *             properties:
 *               channel_code:
 *                 type: string
 *               channel_name:
 *                 type: string
 *               plugin_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *               priority:
 *                 type: integer
 *               supported_currencies:
 *                 type: array
 *                 items:
 *                   type: string
 *               min_amount:
 *                 type: number
 *               max_amount:
 *                 type: number
 *               fee_rate:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/channels', [
  body('channel_code').notEmpty().withMessage('渠道代码不能为空'),
  body('channel_name').notEmpty().withMessage('渠道名称不能为空'),
  body('plugin_id').isInt({ min: 1 }).withMessage('插件ID必须是正整数'),
  body('min_amount').optional().isFloat({ min: 0 }).withMessage('最小金额必须大于等于0'),
  body('max_amount').optional().isFloat({ min: 0 }).withMessage('最大金额必须大于等于0'),
  body('fee_rate').optional().isFloat({ min: 0, max: 1 }).withMessage('费率必须在0-1之间'),
  validate
], async (req, res) => {
  try {
    const channel = await adminController.createChannel(req.body);
    
    res.json({
      success: true,
      message: '支付渠道创建成功',
      data: channel
    });
  } catch (error) {
    logger.error('创建支付渠道失败', { 
      category: 'PAYMENT_ADMIN_API', 
      error,
      body: req.body 
    });
    res.status(500).json({
      success: false,
      message: error.message || '创建支付渠道失败'
    });
  }
});

/**
 * @swagger
 * /api/payment/admin/channels/{channelId}:
 *   put:
 *     summary: 更新支付渠道
 *     tags: [PaymentAdmin]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/channels/:channelId', [
  param('channelId').isInt({ min: 1 }).withMessage('渠道ID必须是正整数'),
  validate
], async (req, res) => {
  try {
    const { channelId } = req.params;
    await adminController.updateChannel(parseInt(channelId), req.body);
    
    res.json({
      success: true,
      message: '支付渠道更新成功'
    });
  } catch (error) {
    logger.error('更新支付渠道失败', { 
      category: 'PAYMENT_ADMIN_API', 
      error,
      channelId: req.params.channelId 
    });
    res.status(500).json({
      success: false,
      message: error.message || '更新支付渠道失败'
    });
  }
});

/**
 * @swagger
 * /api/payment/admin/channels/{channelId}:
 *   delete:
 *     summary: 删除支付渠道
 *     tags: [PaymentAdmin]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/channels/:channelId', [
  param('channelId').isInt({ min: 1 }).withMessage('渠道ID必须是正整数'),
  validate
], async (req, res) => {
  try {
    const { channelId } = req.params;
    await adminController.deleteChannel(parseInt(channelId));
    
    res.json({
      success: true,
      message: '支付渠道删除成功'
    });
  } catch (error) {
    logger.error('删除支付渠道失败', { 
      category: 'PAYMENT_ADMIN_API', 
      error,
      channelId: req.params.channelId 
    });
    res.status(500).json({
      success: false,
      message: error.message || '删除支付渠道失败'
    });
  }
});

// ==================== 渠道配置管理 ====================

/**
 * @swagger
 * /api/payment/admin/channels/{channelId}/configs:
 *   get:
 *     summary: 获取渠道配置
 *     tags: [PaymentAdmin]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/channels/:channelId/configs', [
  param('channelId').isInt({ min: 1 }).withMessage('渠道ID必须是正整数'),
  validate
], async (req, res) => {
  try {
    const { channelId } = req.params;
    const configs = await adminController.getChannelConfigs(parseInt(channelId));
    
    res.json({
      success: true,
      message: '获取成功',
      data: configs
    });
  } catch (error) {
    logger.error('获取渠道配置失败', { 
      category: 'PAYMENT_ADMIN_API', 
      error,
      channelId: req.params.channelId 
    });
    res.status(500).json({
      success: false,
      message: error.message || '获取渠道配置失败'
    });
  }
});

/**
 * @swagger
 * /api/payment/admin/channels/{channelId}/configs:
 *   post:
 *     summary: 设置渠道配置
 *     tags: [PaymentAdmin]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config_key
 *               - config_value
 *             properties:
 *               config_key:
 *                 type: string
 *               config_value:
 *                 type: string
 *               is_encrypted:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 设置成功
 */
router.post('/channels/:channelId/configs', [
  param('channelId').isInt({ min: 1 }).withMessage('渠道ID必须是正整数'),
  body('config_key').notEmpty().withMessage('配置键不能为空'),
  body('config_value').notEmpty().withMessage('配置值不能为空'),
  body('is_encrypted').optional().isBoolean().withMessage('加密标识必须是布尔值'),
  validate
], async (req, res) => {
  try {
    const { channelId } = req.params;
    const { config_key, config_value, is_encrypted = false, description = '' } = req.body;
    
    await adminController.setChannelConfig(
      parseInt(channelId), 
      config_key, 
      config_value, 
      is_encrypted, 
      description
    );
    
    res.json({
      success: true,
      message: '渠道配置设置成功'
    });
  } catch (error) {
    logger.error('设置渠道配置失败', { 
      category: 'PAYMENT_ADMIN_API', 
      error,
      channelId: req.params.channelId 
    });
    res.status(500).json({
      success: false,
      message: error.message || '设置渠道配置失败'
    });
  }
});

module.exports = router;
