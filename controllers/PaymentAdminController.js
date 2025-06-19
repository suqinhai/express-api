const PaymentEngine = require('../services/payment/PaymentEngine');
const { logger } = require('../common/logger');
const { 
  paymentChannelModel, 
  paymentPluginModel,
  paymentOrderModel 
} = require('../models');

/**
 * 支付管理控制器
 * 处理支付系统的管理功能
 */
class PaymentAdminController {
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
      logger.info('支付管理控制器初始化完成', { category: 'PAYMENT_ADMIN_CONTROLLER' });
    } catch (error) {
      logger.error('支付管理控制器初始化失败', { category: 'PAYMENT_ADMIN_CONTROLLER', error });
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

  // ==================== 支付渠道管理 ====================

  /**
   * 获取支付渠道列表
   * @param {Object} filters 筛选条件
   * @returns {Array} 渠道列表
   */
  async getChannels(filters = {}) {
    try {
      const where = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.plugin_id) {
        where.plugin_id = filters.plugin_id;
      }

      const channels = await paymentChannelModel.findAll({
        where,
        include: [
          {
            model: paymentPluginModel,
            as: 'plugin',
            attributes: ['id', 'plugin_name', 'plugin_code', 'status']
          }
        ],
        order: [['priority', 'DESC'], ['created_at', 'ASC']]
      });

      logger.info('获取支付渠道列表成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        count: channels.length
      });

      return channels;
    } catch (error) {
      logger.error('获取支付渠道列表失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        filters
      });
      throw error;
    }
  }

  /**
   * 创建支付渠道
   * @param {Object} channelData 渠道数据
   * @returns {Object} 创建的渠道
   */
  async createChannel(channelData) {
    this._ensureInitialized();
    
    try {
      logger.info('开始创建支付渠道', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelCode: channelData.channel_code
      });

      const channel = await this.paymentEngine.configManager.createChannel(channelData);

      logger.info('支付渠道创建成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId: channel.id,
        channelCode: channel.channel_code
      });

      return channel;
    } catch (error) {
      logger.error('创建支付渠道失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
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
    this._ensureInitialized();
    
    try {
      logger.info('开始更新支付渠道', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId
      });

      await this.paymentEngine.configManager.updateChannel(channelId, updateData);

      logger.info('支付渠道更新成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId
      });
    } catch (error) {
      logger.error('更新支付渠道失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        channelId,
        updateData
      });
      throw error;
    }
  }

  /**
   * 删除支付渠道
   * @param {number} channelId 渠道ID
   */
  async deleteChannel(channelId) {
    this._ensureInitialized();
    
    try {
      logger.info('开始删除支付渠道', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId
      });

      // 检查是否有未完成的订单
      const pendingOrders = await paymentOrderModel.count({
        where: {
          channel_id: channelId,
          status: ['pending', 'processing']
        }
      });

      if (pendingOrders > 0) {
        throw new Error(`该渠道还有${pendingOrders}个未完成的订单，无法删除`);
      }

      await this.paymentEngine.configManager.deleteChannel(channelId);

      logger.info('支付渠道删除成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId
      });
    } catch (error) {
      logger.error('删除支付渠道失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        channelId
      });
      throw error;
    }
  }

  // ==================== 渠道配置管理 ====================

  /**
   * 获取渠道配置
   * @param {number} channelId 渠道ID
   * @returns {Object} 配置对象
   */
  async getChannelConfigs(channelId) {
    this._ensureInitialized();
    
    try {
      logger.info('开始获取渠道配置', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId
      });

      const configs = await this.paymentEngine.configManager.getChannelConfigs(channelId);

      logger.info('获取渠道配置成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId,
        configCount: Object.keys(configs).length
      });

      return configs;
    } catch (error) {
      logger.error('获取渠道配置失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        channelId
      });
      throw error;
    }
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
    this._ensureInitialized();
    
    try {
      logger.info('开始设置渠道配置', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId,
        configKey,
        isEncrypted
      });

      await this.paymentEngine.configManager.setChannelConfig(
        channelId, 
        configKey, 
        configValue, 
        isEncrypted, 
        description
      );

      logger.info('渠道配置设置成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId,
        configKey
      });
    } catch (error) {
      logger.error('设置渠道配置失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        channelId,
        configKey
      });
      throw error;
    }
  }

  /**
   * 删除渠道配置
   * @param {number} channelId 渠道ID
   * @param {string} configKey 配置键
   */
  async deleteChannelConfig(channelId, configKey) {
    this._ensureInitialized();
    
    try {
      logger.info('开始删除渠道配置', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId,
        configKey
      });

      await this.paymentEngine.configManager.deleteChannelConfig(channelId, configKey);

      logger.info('渠道配置删除成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId,
        configKey
      });
    } catch (error) {
      logger.error('删除渠道配置失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        channelId,
        configKey
      });
      throw error;
    }
  }

  // ==================== 插件管理 ====================

  /**
   * 获取插件列表
   * @returns {Array} 插件列表
   */
  async getPlugins() {
    this._ensureInitialized();
    
    try {
      logger.info('开始获取插件列表', { 
        category: 'PAYMENT_ADMIN_CONTROLLER'
      });

      const plugins = await this.paymentEngine.pluginManager.getAllPlugins();

      logger.info('获取插件列表成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        count: plugins.length
      });

      return plugins;
    } catch (error) {
      logger.error('获取插件列表失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error
      });
      throw error;
    }
  }

  /**
   * 更新插件状态
   * @param {number} pluginId 插件ID
   * @param {string} status 新状态
   */
  async updatePluginStatus(pluginId, status) {
    this._ensureInitialized();
    
    try {
      logger.info('开始更新插件状态', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        pluginId,
        status
      });

      await this.paymentEngine.pluginManager.updatePluginStatus(pluginId, status);

      logger.info('插件状态更新成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        pluginId,
        status
      });
    } catch (error) {
      logger.error('更新插件状态失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        pluginId,
        status
      });
      throw error;
    }
  }

  /**
   * 重新加载插件
   * @param {number} pluginId 插件ID
   */
  async reloadPlugin(pluginId) {
    this._ensureInitialized();
    
    try {
      logger.info('开始重新加载插件', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        pluginId
      });

      await this.paymentEngine.pluginManager.reloadPlugin(pluginId);

      logger.info('插件重新加载成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        pluginId
      });
    } catch (error) {
      logger.error('重新加载插件失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        pluginId
      });
      throw error;
    }
  }

  // ==================== 订单管理 ====================

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
        category: 'PAYMENT_ADMIN_CONTROLLER',
        filters,
        pagination
      });

      const result = await this.paymentEngine.orderManager.getOrders(filters, pagination);

      logger.info('获取订单列表成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        total: result.total,
        page: result.page
      });

      return result;
    } catch (error) {
      logger.error('获取订单列表失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        filters,
        pagination
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
        category: 'PAYMENT_ADMIN_CONTROLLER',
        orderNo
      });

      const order = await this.paymentEngine.queryOrder(orderNo);

      logger.info('手动同步订单状态完成', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
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
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        orderNo
      });
      throw error;
    }
  }

  /**
   * 清除配置缓存
   * @param {number} channelId 渠道ID（可选）
   */
  async clearCache(channelId = null) {
    this._ensureInitialized();
    
    try {
      logger.info('开始清除配置缓存', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId
      });

      this.paymentEngine.configManager.clearCache(channelId);

      logger.info('配置缓存清除成功', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        channelId
      });
    } catch (error) {
      logger.error('清除配置缓存失败', { 
        category: 'PAYMENT_ADMIN_CONTROLLER',
        error,
        channelId
      });
      throw error;
    }
  }
}

module.exports = PaymentAdminController;
