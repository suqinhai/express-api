const crypto = require('crypto');
const { Op } = require('sequelize');
const { logger } = require('../../common/logger');
const {
  paymentChannelModel,
  paymentConfigModel,
  paymentPluginModel
} = require('../../models');

/**
 * 配置管理器
 * 负责支付渠道配置的管理、加密存储和缓存
 */
class ConfigManager {
  constructor() {
    this.configCache = new Map(); // 配置缓存
    this.channelCache = new Map(); // 渠道缓存
    this.encryptionKey = process.env.CONFIG_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  /**
   * 初始化配置管理器
   */
  async initialize() {
    try {
      logger.info('正在初始化配置管理器...', { category: 'CONFIG_MANAGER' });
      
      // 预加载活跃渠道配置
      await this._preloadActiveChannels();
      
      logger.info('配置管理器初始化完成', { category: 'CONFIG_MANAGER' });
    } catch (error) {
      logger.error('配置管理器初始化失败', { category: 'CONFIG_MANAGER', error });
      throw error;
    }
  }

  /**
   * 获取支付渠道信息
   * @param {number} channelId 渠道ID
   * @returns {Object} 渠道信息
   */
  async getChannel(channelId) {
    // 先从缓存获取
    if (this.channelCache.has(channelId)) {
      return this.channelCache.get(channelId);
    }

    const channel = await paymentChannelModel.findByPk(channelId, {
      include: [
        {
          model: paymentConfigModel,
          as: 'configs'
        },
        {
          model: paymentPluginModel,
          as: 'plugin'
        }
      ]
    });

    if (channel) {
      // 解密配置值
      if (channel.configs) {
        for (const config of channel.configs) {
          if (config.is_encrypted) {
            config.config_value = this._decrypt(config.config_value);
          }
        }
      }
      
      // 缓存渠道信息
      this.channelCache.set(channelId, channel);
    }

    return channel;
  }

  /**
   * 根据渠道代码获取渠道信息
   * @param {string} channelCode 渠道代码
   * @returns {Object} 渠道信息
   */
  async getChannelByCode(channelCode) {
    const channel = await paymentChannelModel.findOne({
      where: { channel_code: channelCode },
      include: [
        {
          model: paymentConfigModel,
          as: 'configs'
        },
        {
          model: paymentPluginModel,
          as: 'plugin'
        }
      ]
    });

    if (channel && channel.configs) {
      // 解密配置值
      for (const config of channel.configs) {
        if (config.is_encrypted) {
          config.config_value = this._decrypt(config.config_value);
        }
      }
    }

    return channel;
  }

  /**
   * 获取可用的支付渠道列表
   * @param {Object} filters 筛选条件
   * @returns {Array} 渠道列表
   */
  async getAvailableChannels(filters = {}) {
    const where = { status: 'active' };
    
    // 构建查询条件
    if (filters.currency) {
      where.supported_currencies = {
        [Op.like]: `%"${filters.currency}"%`
      };
    }

    const channels = await paymentChannelModel.findAll({
      where,
      include: [
        {
          model: paymentPluginModel,
          as: 'plugin',
          where: { status: 'active' }
        }
      ],
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });

    // 过滤金额范围
    let filteredChannels = channels;
    if (filters.amount) {
      filteredChannels = channels.filter(channel => {
        return filters.amount >= channel.min_amount && 
               filters.amount <= channel.max_amount;
      });
    }

    return filteredChannels;
  }

  /**
   * 创建支付渠道
   * @param {Object} channelData 渠道数据
   * @returns {Object} 创建的渠道
   */
  async createChannel(channelData) {
    try {
      const channel = await paymentChannelModel.create({
        channel_code: channelData.channel_code,
        channel_name: channelData.channel_name,
        plugin_id: channelData.plugin_id,
        status: channelData.status || 'active',
        priority: channelData.priority || 0,
        supported_currencies: JSON.stringify(channelData.supported_currencies || []),
        min_amount: channelData.min_amount || 0.01,
        max_amount: channelData.max_amount || 999999.99,
        fee_rate: channelData.fee_rate || 0,
        description: channelData.description
      });

      logger.info('支付渠道创建成功', { 
        category: 'CONFIG_MANAGER', 
        channelId: channel.id,
        channelCode: channel.channel_code
      });

      return channel;
    } catch (error) {
      logger.error('创建支付渠道失败', { 
        category: 'CONFIG_MANAGER', 
        error,
        channelData 
      });
      throw error;
    }
  }

  /**
   * 更新支付渠道
   * @param {number} channelId 渠道ID
   * @param {Object} updateData 更新数据
   */
  async updateChannel(channelId, updateData) {
    await paymentChannelModel.update(updateData, {
      where: { id: channelId }
    });

    // 清除缓存
    this.channelCache.delete(channelId);

    logger.info('支付渠道更新成功', { 
      category: 'CONFIG_MANAGER', 
      channelId,
      updateData 
    });
  }

  /**
   * 删除支付渠道
   * @param {number} channelId 渠道ID
   */
  async deleteChannel(channelId) {
    // 删除相关配置
    await paymentConfigModel.destroy({
      where: { channel_id: channelId }
    });

    // 删除渠道
    await paymentChannelModel.destroy({
      where: { id: channelId }
    });

    // 清除缓存
    this.channelCache.delete(channelId);
    this.configCache.delete(channelId);

    logger.info('支付渠道删除成功', { 
      category: 'CONFIG_MANAGER', 
      channelId 
    });
  }

  /**
   * 设置渠道配置
   * @param {number} channelId 渠道ID
   * @param {string} configKey 配置键
   * @param {string} configValue 配置值
   * @param {boolean} isEncrypted 是否加密
   * @param {string} description 配置描述
   */
  async setChannelConfig(channelId, configKey, configValue, isEncrypted = false, description = '') {
    let finalValue = configValue;
    
    // 如果需要加密
    if (isEncrypted) {
      finalValue = this._encrypt(configValue);
    }

    await paymentConfigModel.upsert({
      channel_id: channelId,
      config_key: configKey,
      config_value: finalValue,
      is_encrypted: isEncrypted,
      description
    });

    // 清除相关缓存
    this.channelCache.delete(channelId);
    this.configCache.delete(`${channelId}_${configKey}`);

    logger.info('渠道配置设置成功', { 
      category: 'CONFIG_MANAGER', 
      channelId,
      configKey 
    });
  }

  /**
   * 获取渠道配置
   * @param {number} channelId 渠道ID
   * @param {string} configKey 配置键
   * @returns {string} 配置值
   */
  async getChannelConfig(channelId, configKey) {
    const cacheKey = `${channelId}_${configKey}`;
    
    // 先从缓存获取
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    const config = await paymentConfigModel.findOne({
      where: {
        channel_id: channelId,
        config_key: configKey
      }
    });

    if (!config) {
      return null;
    }

    let value = config.config_value;
    
    // 如果是加密的，需要解密
    if (config.is_encrypted) {
      value = this._decrypt(value);
    }

    // 缓存配置值
    this.configCache.set(cacheKey, value);

    return value;
  }

  /**
   * 获取渠道的所有配置
   * @param {number} channelId 渠道ID
   * @returns {Object} 配置对象
   */
  async getChannelConfigs(channelId) {
    const configs = await paymentConfigModel.findAll({
      where: { channel_id: channelId }
    });

    const configObj = {};
    for (const config of configs) {
      let value = config.config_value;
      if (config.is_encrypted) {
        value = this._decrypt(value);
      }
      configObj[config.config_key] = value;
    }

    return configObj;
  }

  /**
   * 删除渠道配置
   * @param {number} channelId 渠道ID
   * @param {string} configKey 配置键
   */
  async deleteChannelConfig(channelId, configKey) {
    await paymentConfigModel.destroy({
      where: {
        channel_id: channelId,
        config_key: configKey
      }
    });

    // 清除缓存
    const cacheKey = `${channelId}_${configKey}`;
    this.configCache.delete(cacheKey);
    this.channelCache.delete(channelId);

    logger.info('渠道配置删除成功', { 
      category: 'CONFIG_MANAGER', 
      channelId,
      configKey 
    });
  }

  /**
   * 清除缓存
   * @param {number} channelId 渠道ID（可选）
   */
  clearCache(channelId = null) {
    if (channelId) {
      this.channelCache.delete(channelId);
      // 清除该渠道的所有配置缓存
      for (const key of this.configCache.keys()) {
        if (key.startsWith(`${channelId}_`)) {
          this.configCache.delete(key);
        }
      }
    } else {
      this.channelCache.clear();
      this.configCache.clear();
    }

    logger.info('配置缓存已清除', { 
      category: 'CONFIG_MANAGER', 
      channelId 
    });
  }

  /**
   * 预加载活跃渠道配置
   * @private
   */
  async _preloadActiveChannels() {
    const activeChannels = await paymentChannelModel.findAll({
      where: { status: 'active' },
      include: [
        {
          model: paymentConfigModel,
          as: 'configs'
        },
        {
          model: paymentPluginModel,
          as: 'plugin'
        }
      ]
    });

    for (const channel of activeChannels) {
      // 解密配置值并缓存
      if (channel.configs) {
        for (const config of channel.configs) {
          if (config.is_encrypted) {
            config.config_value = this._decrypt(config.config_value);
          }
        }
      }
      
      this.channelCache.set(channel.id, channel);
    }

    logger.info('预加载活跃渠道配置完成', { 
      category: 'CONFIG_MANAGER', 
      count: activeChannels.length 
    });
  }

  /**
   * 加密配置值
   * @private
   */
  _encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * 解密配置值
   * @private
   */
  _decrypt(encryptedText) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('配置解密失败', { 
        category: 'CONFIG_MANAGER', 
        error 
      });
      return encryptedText; // 返回原值
    }
  }
}

module.exports = ConfigManager;
