const crypto = require('crypto');
const { Op } = require('sequelize');
const { logger } = require('../../common/logger');
const {
  paymentOrderModel,
  paymentTransactionModel,
  paymentCallbackModel
} = require('../../models');

/**
 * 订单管理器
 * 负责支付订单的创建、更新、查询和状态管理
 */
class OrderManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * 初始化订单管理器
   */
  async initialize() {
    try {
      logger.info('正在初始化订单管理器...', { category: 'ORDER_MANAGER' });
      this.initialized = true;
      logger.info('订单管理器初始化完成', { category: 'ORDER_MANAGER' });
    } catch (error) {
      logger.error('订单管理器初始化失败', { category: 'ORDER_MANAGER', error });
      throw error;
    }
  }

  /**
   * 创建支付订单
   * @param {Object} orderData 订单数据
   * @returns {Object} 创建的订单
   */
  async createOrder(orderData) {
    try {
      // 生成系统订单号
      const orderNo = this._generateOrderNo();
      
      // 计算过期时间（默认30分钟）
      const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

      const order = await paymentOrderModel.create({
        order_no: orderNo,
        merchant_order_no: orderData.merchant_order_no,
        channel_id: orderData.channel_id,
        user_id: orderData.user_id,
        amount: orderData.amount,
        currency: orderData.currency || 'USD',
        payment_method: orderData.payment_method,
        subject: orderData.subject,
        body: orderData.body,
        notify_url: orderData.notify_url,
        return_url: orderData.return_url,
        extra_params: orderData.extra_params ? JSON.stringify(orderData.extra_params) : null,
        expired_at: expiredAt,
        status: 'pending'
      });

      logger.info('支付订单创建成功', { 
        category: 'ORDER_MANAGER', 
        orderId: order.id,
        orderNo: order.order_no
      });

      return order;
    } catch (error) {
      logger.error('创建支付订单失败', { 
        category: 'ORDER_MANAGER', 
        error,
        orderData 
      });
      throw error;
    }
  }

  /**
   * 根据订单号获取订单
   * @param {string} orderNo 订单号
   * @returns {Object} 订单信息
   */
  async getOrderByNo(orderNo) {
    return await paymentOrderModel.findOne({
      where: { order_no: orderNo }
    });
  }

  /**
   * 根据商户订单号获取订单
   * @param {string} merchantOrderNo 商户订单号
   * @returns {Object} 订单信息
   */
  async getOrderByMerchantNo(merchantOrderNo) {
    return await paymentOrderModel.findOne({
      where: { merchant_order_no: merchantOrderNo }
    });
  }

  /**
   * 根据ID获取订单
   * @param {number} orderId 订单ID
   * @returns {Object} 订单信息
   */
  async getOrder(orderId) {
    return await paymentOrderModel.findByPk(orderId);
  }

  /**
   * 更新订单
   * @param {number} orderId 订单ID
   * @param {Object} updateData 更新数据
   */
  async updateOrder(orderId, updateData) {
    await paymentOrderModel.update(updateData, {
      where: { id: orderId }
    });

    logger.info('订单更新成功', { 
      category: 'ORDER_MANAGER', 
      orderId,
      updateData 
    });
  }

  /**
   * 根据订单号更新订单
   * @param {string} orderNo 订单号
   * @param {Object} updateData 更新数据
   */
  async updateOrderByNo(orderNo, updateData) {
    await paymentOrderModel.update(updateData, {
      where: { order_no: orderNo }
    });

    logger.info('订单更新成功', { 
      category: 'ORDER_MANAGER', 
      orderNo,
      updateData 
    });
  }

  /**
   * 创建交易记录
   * @param {Object} transactionData 交易数据
   * @returns {Object} 创建的交易记录
   */
  async createTransaction(transactionData) {
    const transactionNo = this._generateTransactionNo();
    
    const transaction = await paymentTransactionModel.create({
      transaction_no: transactionNo,
      order_id: transactionData.order_id,
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency,
      status: transactionData.status || 'pending',
      gateway_transaction_no: transactionData.gateway_transaction_no,
      gateway_response: transactionData.gateway_response ? 
        JSON.stringify(transactionData.gateway_response) : null,
      error_code: transactionData.error_code,
      error_message: transactionData.error_message,
      processed_at: transactionData.status === 'success' ? new Date() : null
    });

    logger.info('交易记录创建成功', { 
      category: 'ORDER_MANAGER', 
      transactionId: transaction.id,
      transactionNo: transaction.transaction_no
    });

    return transaction;
  }

  /**
   * 记录回调日志
   * @param {Object} callbackData 回调数据
   * @returns {Object} 创建的回调记录
   */
  async logCallback(callbackData) {
    // 如果有订单号，先查找订单ID
    let orderId = callbackData.order_id;
    if (!orderId && callbackData.order_no) {
      const order = await this.getOrderByNo(callbackData.order_no);
      orderId = order ? order.id : null;
    }

    const callback = await paymentCallbackModel.create({
      order_id: orderId,
      callback_type: callbackData.callback_type,
      request_method: callbackData.request_method,
      request_headers: callbackData.request_headers,
      request_body: callbackData.request_body,
      request_params: callbackData.request_params,
      client_ip: callbackData.client_ip,
      user_agent: callbackData.user_agent
    });

    logger.info('回调日志记录成功', { 
      category: 'ORDER_MANAGER', 
      callbackId: callback.id
    });

    return callback;
  }

  /**
   * 更新回调记录
   * @param {number} callbackId 回调ID
   * @param {Object} updateData 更新数据
   */
  async updateCallback(callbackId, updateData) {
    await paymentCallbackModel.update(updateData, {
      where: { id: callbackId }
    });

    logger.info('回调记录更新成功', { 
      category: 'ORDER_MANAGER', 
      callbackId,
      updateData 
    });
  }

  /**
   * 获取订单的交易记录
   * @param {number} orderId 订单ID
   * @returns {Array} 交易记录列表
   */
  async getOrderTransactions(orderId) {
    return await paymentTransactionModel.findAll({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 获取订单的回调记录
   * @param {number} orderId 订单ID
   * @returns {Array} 回调记录列表
   */
  async getOrderCallbacks(orderId) {
    return await paymentCallbackModel.findAll({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 查询订单列表
   * @param {Object} filters 筛选条件
   * @param {Object} pagination 分页参数
   * @returns {Object} 订单列表和总数
   */
  async getOrders(filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const where = {};
    
    // 构建查询条件
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.channel_id) {
      where.channel_id = filters.channel_id;
    }
    if (filters.user_id) {
      where.user_id = filters.user_id;
    }
    if (filters.start_date && filters.end_date) {
      where.created_at = {
        [Op.between]: [filters.start_date, filters.end_date]
      };
    }

    const { count, rows } = await paymentOrderModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      orders: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * 检查并处理过期订单
   */
  async processExpiredOrders() {
    try {
      const expiredOrders = await paymentOrderModel.findAll({
        where: {
          status: ['pending', 'processing'],
          expired_at: {
            [Op.lt]: new Date()
          }
        }
      });

      for (const order of expiredOrders) {
        await this.updateOrder(order.id, {
          status: 'cancelled'
        });
        
        logger.info('订单已过期，状态更新为已取消', { 
          category: 'ORDER_MANAGER', 
          orderId: order.id,
          orderNo: order.order_no
        });
      }

      if (expiredOrders.length > 0) {
        logger.info('处理过期订单完成', { 
          category: 'ORDER_MANAGER', 
          count: expiredOrders.length
        });
      }
    } catch (error) {
      logger.error('处理过期订单失败', { 
        category: 'ORDER_MANAGER', 
        error 
      });
    }
  }

  /**
   * 生成订单号
   * @private
   */
  _generateOrderNo() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY${timestamp}${random}`;
  }

  /**
   * 生成交易流水号
   * @private
   */
  _generateTransactionNo() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
  }
}

module.exports = OrderManager;
