const crypto = require('crypto');
const { logger } = require('../../common/logger');

/**
 * 支付插件基类
 * 定义所有支付插件必须实现的标准接口
 */
class BasePaymentPlugin {
  constructor() {
    this.pluginName = 'BasePaymentPlugin';
    this.pluginVersion = '1.0.0';
    this.supportedMethods = [];
    this.supportedCurrencies = [];
  }

  /**
   * 获取插件信息
   * @returns {Object} 插件信息
   */
  getPluginInfo() {
    return {
      plugin_name: this.pluginName,
      plugin_version: this.pluginVersion,
      supported_methods: this.supportedMethods,
      supported_currencies: this.supportedCurrencies,
      description: this.getDescription(),
      author: this.getAuthor(),
      config_schema: this.getConfigSchema()
    };
  }

  /**
   * 获取插件描述
   * @returns {string} 插件描述
   */
  getDescription() {
    return '支付插件基类';
  }

  /**
   * 获取插件作者
   * @returns {string} 插件作者
   */
  getAuthor() {
    return 'System';
  }

  /**
   * 获取配置架构
   * @returns {Object} 配置架构
   */
  getConfigSchema() {
    return {
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
        description: '网关地址'
      },
      timeout: {
        type: 'number',
        required: false,
        encrypted: false,
        description: '请求超时时间(秒)',
        default: 30
      }
    };
  }

  /**
   * 初始化插件
   * 子类可以重写此方法进行特定的初始化操作
   */
  async initialize() {
    logger.info(`插件 ${this.pluginName} 初始化完成`, { 
      category: 'PAYMENT_PLUGIN' 
    });
  }

  /**
   * 销毁插件
   * 子类可以重写此方法进行清理操作
   */
  async destroy() {
    logger.info(`插件 ${this.pluginName} 已销毁`, { 
      category: 'PAYMENT_PLUGIN' 
    });
  }

  /**
   * 创建支付订单
   * @param {Object} order 订单信息
   * @param {Object} channel 渠道配置
   * @returns {Object} 支付结果
   */
  async createOrder(order, channel) {
    throw new Error('子类必须实现 createOrder 方法');
  }

  /**
   * 处理支付回调
   * @param {Object} callbackData 回调数据
   * @param {Object} channel 渠道配置
   * @returns {Object} 处理结果
   */
  async handleCallback(callbackData, channel) {
    throw new Error('子类必须实现 handleCallback 方法');
  }

  /**
   * 验证回调签名
   * @param {Object} callbackData 回调数据
   * @param {Object} channel 渠道配置
   * @returns {boolean} 验证结果
   */
  async verifyCallback(callbackData, channel) {
    throw new Error('子类必须实现 verifyCallback 方法');
  }

  /**
   * 查询订单状态
   * @param {Object} order 订单信息
   * @param {Object} channel 渠道配置
   * @returns {Object} 查询结果
   */
  async queryOrder(order, channel) {
    throw new Error('子类必须实现 queryOrder 方法');
  }

  /**
   * 申请退款
   * @param {Object} order 订单信息
   * @param {number} refundAmount 退款金额
   * @param {string} reason 退款原因
   * @param {Object} channel 渠道配置
   * @returns {Object} 退款结果
   */
  async refund(order, refundAmount, reason, channel) {
    throw new Error('子类必须实现 refund 方法');
  }

  /**
   * 获取渠道配置值
   * @param {Object} channel 渠道对象
   * @param {string} key 配置键
   * @param {*} defaultValue 默认值
   * @returns {*} 配置值
   */
  getChannelConfig(channel, key, defaultValue = null) {
    if (!channel.configs) {
      return defaultValue;
    }

    const config = channel.configs.find(c => c.config_key === key);
    return config ? config.config_value : defaultValue;
  }

  /**
   * 生成签名
   * @param {Object} params 参数对象
   * @param {string} secretKey 密钥
   * @param {string} algorithm 算法 (md5, sha1, sha256)
   * @returns {string} 签名
   */
  generateSignature(params, secretKey, algorithm = 'md5') {
    // 过滤空值并排序
    const filteredParams = {};
    Object.keys(params).sort().forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        filteredParams[key] = params[key];
      }
    });

    // 构建签名字符串
    const signString = Object.keys(filteredParams)
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&') + `&key=${secretKey}`;

    // 生成签名
    return crypto.createHash(algorithm).update(signString, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * 验证签名
   * @param {Object} params 参数对象
   * @param {string} signature 待验证的签名
   * @param {string} secretKey 密钥
   * @param {string} algorithm 算法
   * @returns {boolean} 验证结果
   */
  verifySignature(params, signature, secretKey, algorithm = 'md5') {
    const expectedSignature = this.generateSignature(params, secretKey, algorithm);
    return expectedSignature.toLowerCase() === signature.toLowerCase();
  }

  /**
   * 发送HTTP请求
   * @param {string} url 请求地址
   * @param {Object} data 请求数据
   * @param {Object} options 请求选项
   * @returns {Object} 响应结果
   */
  async httpRequest(url, data = {}, options = {}) {
    const fetch = require('node-fetch');
    
    const defaultOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `PaymentPlugin/${this.pluginName}/${this.pluginVersion}`
      },
      timeout: 30000
    };

    const finalOptions = { ...defaultOptions, ...options };

    if (finalOptions.method === 'POST' && data) {
      finalOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, finalOptions);
      const responseData = await response.json();

      logger.debug('HTTP请求完成', {
        category: 'PAYMENT_PLUGIN',
        plugin: this.pluginName,
        url,
        status: response.status,
        data: responseData
      });

      return {
        success: response.ok,
        status: response.status,
        data: responseData
      };
    } catch (error) {
      logger.error('HTTP请求失败', {
        category: 'PAYMENT_PLUGIN',
        plugin: this.pluginName,
        url,
        error
      });
      throw error;
    }
  }

  /**
   * 格式化金额
   * @param {number} amount 金额
   * @param {number} decimals 小数位数
   * @returns {string} 格式化后的金额
   */
  formatAmount(amount, decimals = 2) {
    return parseFloat(amount).toFixed(decimals);
  }

  /**
   * 生成随机字符串
   * @param {number} length 长度
   * @returns {string} 随机字符串
   */
  generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 记录插件日志
   * @param {string} level 日志级别
   * @param {string} message 日志消息
   * @param {Object} meta 元数据
   */
  log(level, message, meta = {}) {
    logger[level](message, {
      category: 'PAYMENT_PLUGIN',
      plugin: this.pluginName,
      ...meta
    });
  }
}

module.exports = BasePaymentPlugin;
