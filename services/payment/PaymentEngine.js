const { logger } = require('../../common/logger');
const PluginManager = require('./PluginManager');
const OrderManager = require('./OrderManager');
const ConfigManager = require('./ConfigManager');

/**
 * 支付核心引擎
 * 负责统一的支付处理、路由分发和插件协调
 */
class PaymentEngine {
  constructor() {
    this.pluginManager = new PluginManager();
    this.orderManager = new OrderManager();
    this.configManager = new ConfigManager();
    this.initialized = false;
  }

  /**
   * 初始化支付引擎
   */
  async initialize() {
    try {
      logger.info('正在初始化支付引擎...', { category: 'PAYMENT_ENGINE' });
      
      // 初始化配置管理器
      await this.configManager.initialize();
      
      // 初始化插件管理器
      await this.pluginManager.initialize();
      
      // 初始化订单管理器
      await this.orderManager.initialize();
      
      this.initialized = true;
      logger.info('支付引擎初始化完成', { category: 'PAYMENT_ENGINE' });
    } catch (error) {
      logger.error('支付引擎初始化失败', { category: 'PAYMENT_ENGINE', error });
      throw error;
    }
  }

  /**
   * 创建支付订单
   * @param {Object} orderData 订单数据
   * @returns {Object} 支付结果
   */
  async createPayment(orderData) {
    this._ensureInitialized();
    
    try {
      logger.info('开始创建支付订单', { 
        category: 'PAYMENT_ENGINE', 
        merchantOrderNo: orderData.merchant_order_no 
      });

      // 1. 验证订单数据
      this._validateOrderData(orderData);

      // 2. 选择支付渠道
      const channel = await this._selectPaymentChannel(orderData);
      
      // 3. 获取支付插件
      const plugin = await this.pluginManager.getPlugin(channel.plugin_id);
      
      // 4. 创建订单记录
      const order = await this.orderManager.createOrder({
        ...orderData,
        channel_id: channel.id
      });

      // 5. 调用插件创建支付
      const paymentResult = await plugin.createOrder(order, channel);

      // 6. 更新订单状态
      await this.orderManager.updateOrder(order.id, {
        gateway_order_no: paymentResult.gateway_order_no,
        status: paymentResult.status || 'processing'
      });

      logger.info('支付订单创建成功', { 
        category: 'PAYMENT_ENGINE', 
        orderId: order.id,
        orderNo: order.order_no
      });

      return {
        success: true,
        order_id: order.id,
        order_no: order.order_no,
        payment_url: paymentResult.payment_url,
        qr_code: paymentResult.qr_code,
        ...paymentResult
      };

    } catch (error) {
      logger.error('创建支付订单失败', { 
        category: 'PAYMENT_ENGINE', 
        error,
        orderData 
      });
      throw error;
    }
  }

  /**
   * 处理支付回调
   * @param {string} channelCode 渠道代码
   * @param {Object} callbackData 回调数据
   * @param {Object} request 请求对象
   * @returns {Object} 处理结果
   */
  async handleCallback(channelCode, callbackData, request) {
    this._ensureInitialized();
    
    try {
      logger.info('开始处理支付回调', { 
        category: 'PAYMENT_ENGINE', 
        channelCode 
      });

      // 1. 获取支付渠道和插件
      const channel = await this.configManager.getChannelByCode(channelCode);
      const plugin = await this.pluginManager.getPlugin(channel.plugin_id);

      // 2. 记录回调日志
      const callbackLog = await this.orderManager.logCallback({
        channel_code: channelCode,
        callback_type: 'notify',
        request_method: request.method,
        request_headers: JSON.stringify(request.headers),
        request_body: JSON.stringify(callbackData),
        client_ip: request.ip,
        user_agent: request.get('User-Agent')
      });

      // 3. 验证回调签名
      const isValid = await plugin.verifyCallback(callbackData, channel);
      
      // 4. 更新回调验证状态
      await this.orderManager.updateCallback(callbackLog.id, {
        is_verified: isValid
      });

      if (!isValid) {
        logger.warn('支付回调签名验证失败', { 
          category: 'PAYMENT_ENGINE', 
          channelCode 
        });
        return { success: false, message: '签名验证失败' };
      }

      // 5. 处理回调业务逻辑
      const result = await plugin.handleCallback(callbackData, channel);
      
      // 6. 更新订单状态
      if (result.order_no) {
        await this.orderManager.updateOrderByNo(result.order_no, {
          status: result.status,
          gateway_trade_no: result.gateway_trade_no,
          paid_at: result.paid_at
        });
      }

      // 7. 更新回调处理状态
      await this.orderManager.updateCallback(callbackLog.id, {
        is_processed: true,
        process_result: JSON.stringify(result)
      });

      logger.info('支付回调处理完成', { 
        category: 'PAYMENT_ENGINE', 
        channelCode,
        orderNo: result.order_no
      });

      return result;

    } catch (error) {
      logger.error('处理支付回调失败', { 
        category: 'PAYMENT_ENGINE', 
        error,
        channelCode 
      });
      throw error;
    }
  }

  /**
   * 查询订单状态
   * @param {string} orderNo 订单号
   * @returns {Object} 订单信息
   */
  async queryOrder(orderNo) {
    this._ensureInitialized();
    
    try {
      const order = await this.orderManager.getOrderByNo(orderNo);
      if (!order) {
        throw new Error('订单不存在');
      }

      // 如果订单未完成，尝试从网关查询最新状态
      if (['pending', 'processing'].includes(order.status)) {
        const channel = await this.configManager.getChannel(order.channel_id);
        const plugin = await this.pluginManager.getPlugin(channel.plugin_id);
        
        const queryResult = await plugin.queryOrder(order, channel);
        
        // 更新订单状态
        if (queryResult.status !== order.status) {
          await this.orderManager.updateOrder(order.id, {
            status: queryResult.status,
            gateway_trade_no: queryResult.gateway_trade_no,
            paid_at: queryResult.paid_at
          });
          order.status = queryResult.status;
        }
      }

      return order;
    } catch (error) {
      logger.error('查询订单失败', { 
        category: 'PAYMENT_ENGINE', 
        error,
        orderNo 
      });
      throw error;
    }
  }

  /**
   * 申请退款
   * @param {string} orderNo 订单号
   * @param {number} refundAmount 退款金额
   * @param {string} reason 退款原因
   * @returns {Object} 退款结果
   */
  async refund(orderNo, refundAmount, reason) {
    this._ensureInitialized();
    
    try {
      const order = await this.orderManager.getOrderByNo(orderNo);
      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'success') {
        throw new Error('只有支付成功的订单才能退款');
      }

      const channel = await this.configManager.getChannel(order.channel_id);
      const plugin = await this.pluginManager.getPlugin(channel.plugin_id);
      
      const refundResult = await plugin.refund(order, refundAmount, reason, channel);
      
      // 记录退款交易
      await this.orderManager.createTransaction({
        order_id: order.id,
        type: 'refund',
        amount: refundAmount,
        currency: order.currency,
        status: refundResult.status,
        gateway_transaction_no: refundResult.refund_no
      });

      // 更新订单状态
      if (refundResult.status === 'success') {
        await this.orderManager.updateOrder(order.id, {
          status: 'refunded'
        });
      }

      return refundResult;
    } catch (error) {
      logger.error('申请退款失败', { 
        category: 'PAYMENT_ENGINE', 
        error,
        orderNo 
      });
      throw error;
    }
  }

  /**
   * 获取可用支付渠道列表
   * @param {Object} filters 筛选条件
   * @returns {Array} 支付渠道列表
   */
  async getAvailableChannels(filters = {}) {
    this._ensureInitialized();
    return await this.configManager.getAvailableChannels(filters);
  }

  /**
   * 验证订单数据
   * @private
   */
  _validateOrderData(orderData) {
    const required = ['merchant_order_no', 'amount', 'currency', 'subject'];
    for (const field of required) {
      if (!orderData[field]) {
        throw new Error(`缺少必要参数: ${field}`);
      }
    }

    if (orderData.amount <= 0) {
      throw new Error('支付金额必须大于0');
    }
  }

  /**
   * 选择支付渠道
   * @private
   */
  async _selectPaymentChannel(orderData) {
    const filters = {
      currency: orderData.currency,
      amount: orderData.amount,
      payment_method: orderData.payment_method
    };

    const channels = await this.configManager.getAvailableChannels(filters);
    
    if (channels.length === 0) {
      throw new Error('没有可用的支付渠道');
    }

    // 如果指定了渠道，使用指定的渠道
    if (orderData.channel_code) {
      const channel = channels.find(c => c.channel_code === orderData.channel_code);
      if (!channel) {
        throw new Error('指定的支付渠道不可用');
      }
      return channel;
    }

    // 否则选择优先级最高的渠道
    return channels.sort((a, b) => b.priority - a.priority)[0];
  }

  /**
   * 确保引擎已初始化
   * @private
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('支付引擎未初始化');
    }
  }
}

module.exports = PaymentEngine;
