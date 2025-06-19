const express = require('express');
const router = express.Router();
const PaymentController = require('../../controllers/PaymentController');
const { body, param, query, validationResult } = require('express-validator');
const { logger } = require('../../common/logger');

// 创建控制器实例
const paymentController = new PaymentController();

// 引入管理路由
const adminRouter = require('./admin');
router.use('/admin', adminRouter);

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
 *   - name: Payment
 *     description: 支付相关接口
 */

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     summary: 创建支付订单
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - merchant_order_no
 *               - amount
 *               - currency
 *               - subject
 *             properties:
 *               merchant_order_no:
 *                 type: string
 *                 description: 商户订单号
 *               amount:
 *                 type: number
 *                 description: 支付金额
 *               currency:
 *                 type: string
 *                 description: 货币类型
 *               subject:
 *                 type: string
 *                 description: 订单标题
 *               body:
 *                 type: string
 *                 description: 订单描述
 *               channel_code:
 *                 type: string
 *                 description: 指定支付渠道代码
 *               payment_method:
 *                 type: string
 *                 description: 支付方式
 *               notify_url:
 *                 type: string
 *                 description: 异步通知地址
 *               return_url:
 *                 type: string
 *                 description: 同步返回地址
 *               user_id:
 *                 type: integer
 *                 description: 用户ID
 *               extra_params:
 *                 type: object
 *                 description: 额外参数
 *     responses:
 *       200:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_id:
 *                       type: integer
 *                     order_no:
 *                       type: string
 *                     payment_url:
 *                       type: string
 *                     qr_code:
 *                       type: string
 */
router.post('/create', [
  body('merchant_order_no').notEmpty().withMessage('商户订单号不能为空'),
  body('amount').isFloat({ min: 0.01 }).withMessage('支付金额必须大于0.01'),
  body('currency').notEmpty().withMessage('货币类型不能为空'),
  body('subject').notEmpty().withMessage('订单标题不能为空'),
  body('notify_url').optional().isURL().withMessage('异步通知地址格式不正确'),
  body('return_url').optional().isURL().withMessage('同步返回地址格式不正确'),
  validate
], async (req, res) => {
  try {
    const result = await paymentController.createPayment(req.body);
    res.json({
      success: true,
      message: '支付订单创建成功',
      data: result
    });
  } catch (error) {
    logger.error('创建支付订单失败', { 
      category: 'PAYMENT_API', 
      error,
      body: req.body 
    });
    res.status(500).json({
      success: false,
      message: error.message || '创建支付订单失败'
    });
  }
});

/**
 * @swagger
 * /api/payment/callback/{channelCode}:
 *   post:
 *     summary: 支付回调接口
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: channelCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付渠道代码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 回调处理成功
 */
router.post('/callback/:channelCode', [
  param('channelCode').notEmpty().withMessage('渠道代码不能为空'),
  validate
], async (req, res) => {
  try {
    const { channelCode } = req.params;
    const callbackData = req.body;
    
    const result = await paymentController.handleCallback(channelCode, callbackData, req);
    
    // 根据不同渠道返回不同格式的响应
    if (result.success) {
      res.send(result.response || 'SUCCESS');
    } else {
      res.status(400).send(result.response || 'FAIL');
    }
  } catch (error) {
    logger.error('处理支付回调失败', { 
      category: 'PAYMENT_API', 
      error,
      channelCode: req.params.channelCode,
      body: req.body 
    });
    res.status(500).send('FAIL');
  }
});

/**
 * @swagger
 * /api/payment/query/{orderNo}:
 *   get:
 *     summary: 查询订单状态
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: orderNo
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单号
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PaymentOrder'
 */
router.get('/query/:orderNo', [
  param('orderNo').notEmpty().withMessage('订单号不能为空'),
  validate
], async (req, res) => {
  try {
    const { orderNo } = req.params;
    const order = await paymentController.queryOrder(orderNo);
    
    res.json({
      success: true,
      message: '查询成功',
      data: order
    });
  } catch (error) {
    logger.error('查询订单失败', { 
      category: 'PAYMENT_API', 
      error,
      orderNo: req.params.orderNo 
    });
    res.status(500).json({
      success: false,
      message: error.message || '查询订单失败'
    });
  }
});

/**
 * @swagger
 * /api/payment/refund:
 *   post:
 *     summary: 申请退款
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_no
 *               - refund_amount
 *             properties:
 *               order_no:
 *                 type: string
 *                 description: 订单号
 *               refund_amount:
 *                 type: number
 *                 description: 退款金额
 *               reason:
 *                 type: string
 *                 description: 退款原因
 *     responses:
 *       200:
 *         description: 退款申请成功
 */
router.post('/refund', [
  body('order_no').notEmpty().withMessage('订单号不能为空'),
  body('refund_amount').isFloat({ min: 0.01 }).withMessage('退款金额必须大于0.01'),
  body('reason').optional().isString().withMessage('退款原因必须是字符串'),
  validate
], async (req, res) => {
  try {
    const { order_no, refund_amount, reason } = req.body;
    const result = await paymentController.refund(order_no, refund_amount, reason);
    
    res.json({
      success: true,
      message: '退款申请成功',
      data: result
    });
  } catch (error) {
    logger.error('申请退款失败', { 
      category: 'PAYMENT_API', 
      error,
      body: req.body 
    });
    res.status(500).json({
      success: false,
      message: error.message || '申请退款失败'
    });
  }
});

/**
 * @swagger
 * /api/payment/channels:
 *   get:
 *     summary: 获取可用支付渠道
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: 货币类型筛选
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *         description: 支付金额筛选
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *         description: 支付方式筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentChannel'
 */
router.get('/channels', async (req, res) => {
  try {
    const filters = {
      currency: req.query.currency,
      amount: req.query.amount ? parseFloat(req.query.amount) : undefined,
      payment_method: req.query.payment_method
    };
    
    const channels = await paymentController.getAvailableChannels(filters);
    
    res.json({
      success: true,
      message: '获取成功',
      data: channels
    });
  } catch (error) {
    logger.error('获取支付渠道失败', { 
      category: 'PAYMENT_API', 
      error,
      query: req.query 
    });
    res.status(500).json({
      success: false,
      message: error.message || '获取支付渠道失败'
    });
  }
});

module.exports = router;
