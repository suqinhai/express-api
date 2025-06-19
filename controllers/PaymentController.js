const PaymentEngine = require('../services/payment/PaymentEngine');
const { logger } = require('../common/logger');

/**
 * 支付控制器
 * 处理支付相关的HTTP请求
 */
class PaymentController {
  constructor() {
    this.paymentEngine = new PaymentEngine();
    this.initialized = false;
    this._initialize();
  }

  /**
   * 初始化支付引擎
   * @private
   */
  async _initialize() {
    try {
      await this.paymentEngine.initialize();
      this.initialized = true;
      logger.info('支付控制器初始化完成', { category: 'PAYMENT_CONTROLLER' });
    } catch (error) {
      logger.error('支付控制器初始化失败', { category: 'PAYMENT_CONTROLLER', error });
    }
  }

  /**
   * 确保引擎已初始化
   * @private
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('支付引擎未初始化完成，请稍后重试');
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
        category: 'PAYMENT_CONTROLLER',
        merchantOrderNo: orderData.merchant_order_no
      });

      const result = await this.paymentEngine.createPayment(orderData);

      logger.info('支付订单创建成功', { 
        category: 'PAYMENT_CONTROLLER',
        orderId: result.order_id,
        orderNo: result.order_no
      });

      return result;
    } catch (error) {
      logger.error('创建支付订单失败', { 
        category: 'PAYMENT_CONTROLLER',
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
        category: 'PAYMENT_CONTROLLER',
        channelCode,
        ip: request.ip
      });

      const result = await this.paymentEngine.handleCallback(channelCode, callbackData, request);

      logger.info('支付回调处理完成', { 
        category: 'PAYMENT_CONTROLLER',
        channelCode,
        success: result.success
      });

      return result;
    } catch (error) {
      logger.error('处理支付回调失败', { 
        category: 'PAYMENT_CONTROLLER',
        error,
        channelCode,
        callbackData
      });
      
      // 回调处理失败时返回失败响应
      return {
        success: false,
        message: error.message,
        response: 'FAIL'
      };
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
      logger.info('开始查询订单状态', { 
        category: 'PAYMENT_CONTROLLER',
        orderNo
      });

      const order = await this.paymentEngine.queryOrder(orderNo);

      logger.info('订单状态查询完成', { 
        category: 'PAYMENT_CONTROLLER',
        orderNo,
        status: order.status
      });

      return order;
    } catch (error) {
      logger.error('查询订单状态失败', { 
        category: 'PAYMENT_CONTROLLER',
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
  async refund(orderNo, refundAmount, reason = '') {
    this._ensureInitialized();
    
    try {
      logger.info('开始申请退款', { 
        category: 'PAYMENT_CONTROLLER',
        orderNo,
        refundAmount,
        reason
      });

      const result = await this.paymentEngine.refund(orderNo, refundAmount, reason);

      logger.info('退款申请完成', { 
        category: 'PAYMENT_CONTROLLER',
        orderNo,
        refundAmount,
        success: result.success
      });

      return result;
    } catch (error) {
      logger.error('申请退款失败', { 
        category: 'PAYMENT_CONTROLLER',
        error,
        orderNo,
        refundAmount
      });
      throw error;
    }
  }

  /**
   * 获取可用支付渠道
   * @param {Object} filters 筛选条件
   * @returns {Array} 支付渠道列表
   */
  async getAvailableChannels(filters = {}) {
    this._ensureInitialized();
    
    try {
      logger.info('开始获取可用支付渠道', { 
        category: 'PAYMENT_CONTROLLER',
        filters
      });

      const channels = await this.paymentEngine.getAvailableChannels(filters);

      logger.info('获取可用支付渠道完成', { 
        category: 'PAYMENT_CONTROLLER',
        count: channels.length
      });

      // 过滤敏感信息
      const safeChannels = channels.map(channel => ({
        id: channel.id,
        channel_code: channel.channel_code,
        channel_name: channel.channel_name,
        status: channel.status,
        priority: channel.priority,
        supported_currencies: channel.supported_currencies,
        min_amount: channel.min_amount,
        max_amount: channel.max_amount,
        fee_rate: channel.fee_rate,
        description: channel.description
      }));

      return safeChannels;
    } catch (error) {
      logger.error('获取可用支付渠道失败', { 
        category: 'PAYMENT_CONTROLLER',
        error,
        filters
      });
      throw error;
    }
  }

  /**
   * 获取订单列表
   * @param {Object} filters 筛选条件
   * @param {Object} pagination 分页参数
   * @returns {Object} 订单列表和分页信息
   */
  async getOrders(filters = {}, pagination = {}) {
    this._ensureInitialized();
    
    try {
      logger.info('开始获取订单列表', { 
        category: 'PAYMENT_CONTROLLER',
        filters,
        pagination
      });

      const result = await this.paymentEngine.orderManager.getOrders(filters, pagination);

      logger.info('获取订单列表完成', { 
        category: 'PAYMENT_CONTROLLER',
        total: result.total,
        page: result.page
      });

      return result;
    } catch (error) {
      logger.error('获取订单列表失败', { 
        category: 'PAYMENT_CONTROLLER',
        error,
        filters,
        pagination
      });
      throw error;
    }
  }

  /**
   * 获取订单详情
   * @param {number} orderId 订单ID
   * @returns {Object} 订单详情
   */
  async getOrderDetail(orderId) {
    this._ensureInitialized();
    
    try {
      logger.info('开始获取订单详情', { 
        category: 'PAYMENT_CONTROLLER',
        orderId
      });

      const order = await this.paymentEngine.orderManager.getOrder(orderId);
      if (!order) {
        throw new Error('订单不存在');
      }

      // 获取交易记录
      const transactions = await this.paymentEngine.orderManager.getOrderTransactions(orderId);
      
      // 获取回调记录
      const callbacks = await this.paymentEngine.orderManager.getOrderCallbacks(orderId);

      const result = {
        ...order.toJSON(),
        transactions,
        callbacks
      };

      logger.info('获取订单详情完成', { 
        category: 'PAYMENT_CONTROLLER',
        orderId,
        status: order.status
      });

      return result;
    } catch (error) {
      logger.error('获取订单详情失败', { 
        category: 'PAYMENT_CONTROLLER',
        error,
        orderId
      });
      throw error;
    }
  }

  /**
   * 手动同步订单状态
   * @param {string} orderNo 订单号
   * @returns {Object} 同步结果
   */
  async syncOrderStatus(orderNo) {
    this._ensureInitialized();
    
    try {
      logger.info('开始手动同步订单状态', { 
        category: 'PAYMENT_CONTROLLER',
        orderNo
      });

      // 查询订单最新状态
      const order = await this.queryOrder(orderNo);

      logger.info('手动同步订单状态完成', { 
        category: 'PAYMENT_CONTROLLER',
        orderNo,
        status: order.status
      });

      return {
        success: true,
        message: '订单状态同步成功',
        data: order
      };
    } catch (error) {
      logger.error('手动同步订单状态失败', { 
        category: 'PAYMENT_CONTROLLER',
        error,
        orderNo
      });
      throw error;
    }
  }
}

module.exports = PaymentController;
