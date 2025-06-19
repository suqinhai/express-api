const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

describe('支付系统测试', () => {
  beforeAll(async () => {
    // 同步数据库
    await sequelize.sync({ force: true });
    
    // 插入测试数据
    const { syncPaymentDatabase } = require('../scripts/sync-payment-db');
    await syncPaymentDatabase();
  });

  afterAll(async () => {
    // 清理数据库连接
    await sequelize.close();
  });

  describe('支付API测试', () => {
    test('获取可用支付渠道', async () => {
      const response = await request(app)
        .get('/api/payment/channels')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('创建支付订单 - 参数验证', async () => {
      const response = await request(app)
        .post('/api/payment/create')
        .send({
          // 缺少必要参数
          amount: 100
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('参数验证失败');
    });

    test('创建支付订单 - 成功', async () => {
      const orderData = {
        merchant_order_no: 'TEST_' + Date.now(),
        amount: 100.50,
        currency: 'USD',
        subject: '测试订单',
        body: '这是一个测试订单',
        notify_url: 'http://localhost:3000/test/notify',
        return_url: 'http://localhost:3000/test/return'
      };

      const response = await request(app)
        .post('/api/payment/create')
        .send(orderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order_id');
      expect(response.body.data).toHaveProperty('order_no');
    });

    test('查询订单状态', async () => {
      // 先创建一个订单
      const orderData = {
        merchant_order_no: 'QUERY_TEST_' + Date.now(),
        amount: 50.00,
        currency: 'USD',
        subject: '查询测试订单'
      };

      const createResponse = await request(app)
        .post('/api/payment/create')
        .send(orderData)
        .expect(200);

      const orderNo = createResponse.body.data.order_no;

      // 查询订单
      const queryResponse = await request(app)
        .get(`/api/payment/query/${orderNo}`)
        .expect(200);

      expect(queryResponse.body.success).toBe(true);
      expect(queryResponse.body.data).toHaveProperty('order_no', orderNo);
      expect(queryResponse.body.data).toHaveProperty('status');
    });

    test('支付回调处理', async () => {
      const callbackData = {
        order_no: 'TEST_CALLBACK_' + Date.now(),
        status: 'success',
        trade_no: 'TXN_' + Date.now(),
        amount: '100.00',
        sign: 'test_signature'
      };

      const response = await request(app)
        .post('/api/payment/callback/UsdtPay')
        .send(callbackData)
        .expect(200);

      // 回调处理可能返回不同的响应格式
      expect(typeof response.text).toBe('string');
    });
  });

  describe('支付管理API测试', () => {
    test('获取支付渠道列表', async () => {
      const response = await request(app)
        .get('/api/payment/admin/channels')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('创建支付渠道', async () => {
      const channelData = {
        channel_code: 'TestPay_' + Date.now(),
        channel_name: '测试支付渠道',
        plugin_id: 1,
        status: 'active',
        priority: 50,
        supported_currencies: ['USD', 'CNY'],
        min_amount: 1.00,
        max_amount: 10000.00,
        fee_rate: 0.03,
        description: '这是一个测试支付渠道'
      };

      const response = await request(app)
        .post('/api/payment/admin/channels')
        .send(channelData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.channel_code).toBe(channelData.channel_code);
    });

    test('获取渠道配置', async () => {
      const response = await request(app)
        .get('/api/payment/admin/channels/1/configs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data).toBe('object');
    });

    test('设置渠道配置', async () => {
      const configData = {
        config_key: 'test_config',
        config_value: 'test_value',
        is_encrypted: false,
        description: '测试配置项'
      };

      const response = await request(app)
        .post('/api/payment/admin/channels/1/configs')
        .send(configData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('成功');
    });
  });

  describe('支付插件测试', () => {
    test('UsdtPay插件基本功能', () => {
      const UsdtPay = require('../plugins/payment/UsdtPay');
      const plugin = new UsdtPay();

      // 测试插件信息
      const pluginInfo = plugin.getPluginInfo();
      expect(pluginInfo.plugin_name).toBe('UsdtPay');
      expect(pluginInfo.plugin_version).toBe('1.0.0');
      expect(Array.isArray(pluginInfo.supported_methods)).toBe(true);
      expect(Array.isArray(pluginInfo.supported_currencies)).toBe(true);

      // 测试配置架构
      const configSchema = plugin.getConfigSchema();
      expect(configSchema).toHaveProperty('merchant_id');
      expect(configSchema).toHaveProperty('api_key');
      expect(configSchema).toHaveProperty('secret_key');
    });

    test('签名生成和验证', () => {
      const UsdtPay = require('../plugins/payment/UsdtPay');
      const plugin = new UsdtPay();

      const params = {
        order_no: 'TEST123',
        amount: '100.00',
        currency: 'USD'
      };
      const secretKey = 'test_secret_key';

      // 生成签名
      const signature = plugin.generateSignature(params, secretKey, 'md5');
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);

      // 验证签名
      const isValid = plugin.verifySignature(params, signature, secretKey, 'md5');
      expect(isValid).toBe(true);

      // 验证错误签名
      const isInvalid = plugin.verifySignature(params, 'wrong_signature', secretKey, 'md5');
      expect(isInvalid).toBe(false);
    });
  });

  describe('数据模型测试', () => {
    test('支付订单模型', async () => {
      const { paymentOrderModel } = require('../models');

      const orderData = {
        order_no: 'MODEL_TEST_' + Date.now(),
        merchant_order_no: 'MERCHANT_' + Date.now(),
        channel_id: 1,
        amount: 99.99,
        currency: 'USD',
        status: 'pending',
        subject: '模型测试订单'
      };

      const order = await paymentOrderModel.create(orderData);
      expect(order.id).toBeDefined();
      expect(order.order_no).toBe(orderData.order_no);
      expect(order.status).toBe('pending');

      // 更新订单状态
      await order.update({ status: 'success' });
      expect(order.status).toBe('success');
    });

    test('支付渠道模型', async () => {
      const { paymentChannelModel } = require('../models');

      const channelData = {
        channel_code: 'MODEL_TEST_CHANNEL',
        channel_name: '模型测试渠道',
        plugin_id: 1,
        status: 'active',
        priority: 100,
        min_amount: 1.00,
        max_amount: 5000.00,
        fee_rate: 0.025
      };

      const channel = await paymentChannelModel.create(channelData);
      expect(channel.id).toBeDefined();
      expect(channel.channel_code).toBe(channelData.channel_code);
      expect(channel.status).toBe('active');
    });

    test('支付配置模型', async () => {
      const { paymentConfigModel } = require('../models');

      const configData = {
        channel_id: 1,
        config_key: 'test_key',
        config_value: 'test_value',
        is_encrypted: false,
        description: '测试配置'
      };

      const config = await paymentConfigModel.create(configData);
      expect(config.id).toBeDefined();
      expect(config.config_key).toBe(configData.config_key);
      expect(config.is_encrypted).toBe(false);
    });
  });
});
