const BasePaymentPlugin = require('./BasePaymentPlugin');
const crypto = require('crypto');

/**
 * UsdtPay支付插件
 * 示例USDT支付渠道实现
 */
class UsdtPay extends BasePaymentPlugin {
  constructor() {
    super();
    this.pluginName = 'UsdtPay';
    this.pluginVersion = '1.0.0';
    this.supportedMethods = ['usdt_trc20', 'usdt_erc20', 'usdt_omni'];
    this.supportedCurrencies = ['USDT', 'USD'];
  }

  /**
   * 获取插件描述
   */
  getDescription() {
    return 'USDT数字货币支付插件，支持TRC20、ERC20、OMNI协议';
  }

  /**
   * 获取插件作者
   */
  getAuthor() {
    return 'Payment Team';
  }

  /**
   * 获取配置架构
   */
  getConfigSchema() {
    return {
      merchant_id: {
        type: 'string',
        required: true,
        encrypted: false,
        description: '商户ID'
      },
      api_key: {
        type: 'string',
        required: true,
        encrypted: true,
        description: 'API密钥'
      },
      secret_key: {
        type: 'string',
        required: true,
        encrypted: true,
        description: '签名密钥'
      },
      gateway_url: {
        type: 'string',
        required: true,
        encrypted: false,
        description: '网关地址',
        default: 'https://api.usdtpay.com'
      },
      callback_url: {
        type: 'string',
        required: true,
        encrypted: false,
        description: '回调地址'
      },
      timeout: {
        type: 'number',
        required: false,
        encrypted: false,
        description: '请求超时时间(秒)',
        default: 30
      },
      default_protocol: {
        type: 'string',
        required: false,
        encrypted: false,
        description: '默认USDT协议',
        default: 'TRC20',
        options: ['TRC20', 'ERC20', 'OMNI']
      }
    };
  }

  /**
   * 创建支付订单
   */
  async createOrder(order, channel) {
    try {
      this.log('info', '开始创建UsdtPay支付订单', { 
        orderNo: order.order_no,
        amount: order.amount 
      });

      // 获取配置
      const merchantId = this.getChannelConfig(channel, 'merchant_id');
      const apiKey = this.getChannelConfig(channel, 'api_key');
      const secretKey = this.getChannelConfig(channel, 'secret_key');
      const gatewayUrl = this.getChannelConfig(channel, 'gateway_url');
      const callbackUrl = this.getChannelConfig(channel, 'callback_url');
      const defaultProtocol = this.getChannelConfig(channel, 'default_protocol', 'TRC20');

      if (!merchantId || !apiKey || !secretKey || !gatewayUrl) {
        throw new Error('UsdtPay配置不完整');
      }

      // 构建请求参数
      const params = {
        merchant_id: merchantId,
        order_no: order.order_no,
        amount: this.formatAmount(order.amount, 2),
        currency: order.currency,
        subject: order.subject,
        body: order.body || order.subject,
        protocol: order.payment_method || defaultProtocol,
        notify_url: callbackUrl,
        return_url: order.return_url || '',
        timestamp: Math.floor(Date.now() / 1000),
        nonce: this.generateRandomString(16)
      };

      // 生成签名
      params.sign = this.generateSignature(params, secretKey, 'sha256');

      // 发送请求
      const response = await this.httpRequest(
        `${gatewayUrl}/api/payment/create`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.success) {
        throw new Error(`UsdtPay API请求失败: ${response.status}`);
      }

      const { data } = response;

      if (data.code !== 0) {
        throw new Error(`UsdtPay创建订单失败: ${data.message}`);
      }

      this.log('info', 'UsdtPay支付订单创建成功', { 
        orderNo: order.order_no,
        gatewayOrderNo: data.data.order_id
      });

      return {
        success: true,
        gateway_order_no: data.data.order_id,
        payment_url: data.data.payment_url,
        qr_code: data.data.qr_code,
        wallet_address: data.data.wallet_address,
        amount_usdt: data.data.amount_usdt,
        protocol: data.data.protocol,
        expires_at: data.data.expires_at,
        status: 'processing'
      };

    } catch (error) {
      this.log('error', 'UsdtPay创建订单失败', { 
        orderNo: order.order_no,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 处理支付回调
   */
  async handleCallback(callbackData, channel) {
    try {
      this.log('info', '开始处理UsdtPay支付回调', { 
        orderNo: callbackData.order_no 
      });

      // 验证必要参数
      if (!callbackData.order_no || !callbackData.status) {
        throw new Error('回调参数不完整');
      }

      // 确定订单状态
      let orderStatus = 'pending';
      switch (callbackData.status) {
        case 'success':
        case 'paid':
          orderStatus = 'success';
          break;
        case 'failed':
        case 'expired':
          orderStatus = 'failed';
          break;
        case 'pending':
        case 'processing':
          orderStatus = 'processing';
          break;
        default:
          orderStatus = 'pending';
      }

      const result = {
        success: true,
        order_no: callbackData.order_no,
        gateway_trade_no: callbackData.trade_no || callbackData.transaction_id,
        status: orderStatus,
        paid_at: orderStatus === 'success' ? new Date() : null,
        response: 'SUCCESS'
      };

      this.log('info', 'UsdtPay支付回调处理完成', { 
        orderNo: callbackData.order_no,
        status: orderStatus
      });

      return result;

    } catch (error) {
      this.log('error', 'UsdtPay回调处理失败', { 
        error: error.message,
        callbackData 
      });
      
      return {
        success: false,
        message: error.message,
        response: 'FAIL'
      };
    }
  }

  /**
   * 验证回调签名
   */
  async verifyCallback(callbackData, channel) {
    try {
      const secretKey = this.getChannelConfig(channel, 'secret_key');
      
      if (!secretKey) {
        this.log('error', 'UsdtPay签名密钥未配置');
        return false;
      }

      if (!callbackData.sign) {
        this.log('error', 'UsdtPay回调缺少签名');
        return false;
      }

      // 提取签名
      const receivedSign = callbackData.sign;
      const paramsForSign = { ...callbackData };
      delete paramsForSign.sign;

      // 验证签名
      const isValid = this.verifySignature(paramsForSign, receivedSign, secretKey, 'sha256');

      this.log('info', 'UsdtPay回调签名验证结果', { 
        isValid,
        orderNo: callbackData.order_no 
      });

      return isValid;

    } catch (error) {
      this.log('error', 'UsdtPay签名验证失败', { 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * 查询订单状态
   */
  async queryOrder(order, channel) {
    try {
      this.log('info', '开始查询UsdtPay订单状态', { 
        orderNo: order.order_no 
      });

      // 获取配置
      const merchantId = this.getChannelConfig(channel, 'merchant_id');
      const apiKey = this.getChannelConfig(channel, 'api_key');
      const secretKey = this.getChannelConfig(channel, 'secret_key');
      const gatewayUrl = this.getChannelConfig(channel, 'gateway_url');

      // 构建查询参数
      const params = {
        merchant_id: merchantId,
        order_no: order.order_no,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: this.generateRandomString(16)
      };

      // 生成签名
      params.sign = this.generateSignature(params, secretKey, 'sha256');

      // 发送查询请求
      const response = await this.httpRequest(
        `${gatewayUrl}/api/payment/query`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.success || response.data.code !== 0) {
        throw new Error(`查询订单失败: ${response.data?.message || '网络错误'}`);
      }

      const orderInfo = response.data.data;
      
      // 转换状态
      let status = 'pending';
      switch (orderInfo.status) {
        case 'success':
        case 'paid':
          status = 'success';
          break;
        case 'failed':
        case 'expired':
          status = 'failed';
          break;
        case 'processing':
          status = 'processing';
          break;
      }

      const result = {
        status,
        gateway_trade_no: orderInfo.trade_no,
        paid_at: status === 'success' && orderInfo.paid_at ? new Date(orderInfo.paid_at * 1000) : null
      };

      this.log('info', 'UsdtPay订单状态查询完成', { 
        orderNo: order.order_no,
        status 
      });

      return result;

    } catch (error) {
      this.log('error', 'UsdtPay查询订单失败', { 
        orderNo: order.order_no,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 申请退款
   */
  async refund(order, refundAmount, reason, channel) {
    try {
      this.log('info', '开始UsdtPay退款申请', { 
        orderNo: order.order_no,
        refundAmount 
      });

      // USDT支付通常不支持自动退款，需要人工处理
      throw new Error('USDT支付不支持自动退款，请联系客服人工处理');

    } catch (error) {
      this.log('error', 'UsdtPay退款申请失败', { 
        orderNo: order.order_no,
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = UsdtPay;
