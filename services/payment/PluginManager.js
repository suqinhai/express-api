const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../../common/logger');
const { paymentPluginModel } = require('../../models');

/**
 * 插件管理器
 * 负责插件的动态加载、生命周期管理和实例缓存
 */
class PluginManager {
  constructor() {
    this.plugins = new Map(); // 插件实例缓存
    this.pluginConfigs = new Map(); // 插件配置缓存
    this.pluginPath = path.join(__dirname, '../../plugins/payment');
  }

  /**
   * 初始化插件管理器
   */
  async initialize() {
    try {
      logger.info('正在初始化插件管理器...', { category: 'PLUGIN_MANAGER' });
      
      // 确保插件目录存在
      await this._ensurePluginDirectory();
      
      // 扫描并注册插件
      await this._scanAndRegisterPlugins();
      
      // 加载启用的插件
      await this._loadActivePlugins();
      
      logger.info('插件管理器初始化完成', { category: 'PLUGIN_MANAGER' });
    } catch (error) {
      logger.error('插件管理器初始化失败', { category: 'PLUGIN_MANAGER', error });
      throw error;
    }
  }

  /**
   * 获取插件实例
   * @param {number} pluginId 插件ID
   * @returns {Object} 插件实例
   */
  async getPlugin(pluginId) {
    if (this.plugins.has(pluginId)) {
      return this.plugins.get(pluginId);
    }

    // 如果插件未加载，尝试加载
    const pluginConfig = await paymentPluginModel.findByPk(pluginId);
    if (!pluginConfig) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    if (pluginConfig.status !== 'active') {
      throw new Error(`插件未启用: ${pluginConfig.plugin_name}`);
    }

    const plugin = await this._loadPlugin(pluginConfig);
    return plugin;
  }

  /**
   * 重新加载插件
   * @param {number} pluginId 插件ID
   */
  async reloadPlugin(pluginId) {
    try {
      // 卸载现有插件
      if (this.plugins.has(pluginId)) {
        const plugin = this.plugins.get(pluginId);
        if (typeof plugin.destroy === 'function') {
          await plugin.destroy();
        }
        this.plugins.delete(pluginId);
      }

      // 清除require缓存
      const pluginConfig = await paymentPluginModel.findByPk(pluginId);
      if (pluginConfig) {
        const pluginPath = path.resolve(pluginConfig.plugin_path);
        delete require.cache[pluginPath];
      }

      // 重新加载插件
      await this.getPlugin(pluginId);
      
      logger.info('插件重新加载成功', { 
        category: 'PLUGIN_MANAGER', 
        pluginId 
      });
    } catch (error) {
      logger.error('插件重新加载失败', { 
        category: 'PLUGIN_MANAGER', 
        error,
        pluginId 
      });
      throw error;
    }
  }

  /**
   * 注册新插件
   * @param {Object} pluginInfo 插件信息
   */
  async registerPlugin(pluginInfo) {
    try {
      // 验证插件文件是否存在
      const pluginPath = path.resolve(pluginInfo.plugin_path);
      await fs.access(pluginPath);

      // 尝试加载插件以验证其有效性
      const PluginClass = require(pluginPath);
      const tempPlugin = new PluginClass();
      
      // 验证插件接口
      this._validatePluginInterface(tempPlugin);

      // 保存插件配置到数据库
      const plugin = await paymentPluginModel.create({
        plugin_name: pluginInfo.plugin_name,
        plugin_code: pluginInfo.plugin_code,
        plugin_version: pluginInfo.plugin_version || '1.0.0',
        plugin_path: pluginInfo.plugin_path,
        description: pluginInfo.description,
        author: pluginInfo.author,
        config_schema: JSON.stringify(pluginInfo.config_schema || {}),
        supported_methods: JSON.stringify(pluginInfo.supported_methods || []),
        supported_currencies: JSON.stringify(pluginInfo.supported_currencies || []),
        load_priority: pluginInfo.load_priority || 0,
        status: 'active'
      });

      logger.info('插件注册成功', { 
        category: 'PLUGIN_MANAGER', 
        pluginName: pluginInfo.plugin_name 
      });

      return plugin;
    } catch (error) {
      logger.error('插件注册失败', { 
        category: 'PLUGIN_MANAGER', 
        error,
        pluginInfo 
      });
      throw error;
    }
  }

  /**
   * 卸载插件
   * @param {number} pluginId 插件ID
   */
  async unregisterPlugin(pluginId) {
    try {
      // 卸载插件实例
      if (this.plugins.has(pluginId)) {
        const plugin = this.plugins.get(pluginId);
        if (typeof plugin.destroy === 'function') {
          await plugin.destroy();
        }
        this.plugins.delete(pluginId);
      }

      // 从数据库删除插件配置
      await paymentPluginModel.destroy({
        where: { id: pluginId }
      });

      logger.info('插件卸载成功', { 
        category: 'PLUGIN_MANAGER', 
        pluginId 
      });
    } catch (error) {
      logger.error('插件卸载失败', { 
        category: 'PLUGIN_MANAGER', 
        error,
        pluginId 
      });
      throw error;
    }
  }

  /**
   * 获取所有插件列表
   * @returns {Array} 插件列表
   */
  async getAllPlugins() {
    return await paymentPluginModel.findAll({
      order: [['load_priority', 'DESC'], ['created_at', 'ASC']]
    });
  }

  /**
   * 更新插件状态
   * @param {number} pluginId 插件ID
   * @param {string} status 新状态
   */
  async updatePluginStatus(pluginId, status) {
    await paymentPluginModel.update(
      { status },
      { where: { id: pluginId } }
    );

    // 如果禁用插件，从缓存中移除
    if (status !== 'active' && this.plugins.has(pluginId)) {
      const plugin = this.plugins.get(pluginId);
      if (typeof plugin.destroy === 'function') {
        await plugin.destroy();
      }
      this.plugins.delete(pluginId);
    }
  }

  /**
   * 确保插件目录存在
   * @private
   */
  async _ensurePluginDirectory() {
    try {
      await fs.access(this.pluginPath);
    } catch (error) {
      await fs.mkdir(this.pluginPath, { recursive: true });
      logger.info('创建插件目录', { 
        category: 'PLUGIN_MANAGER', 
        path: this.pluginPath 
      });
    }
  }

  /**
   * 扫描并注册插件
   * @private
   */
  async _scanAndRegisterPlugins() {
    try {
      const files = await fs.readdir(this.pluginPath);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const pluginPath = path.join(this.pluginPath, file);
          const pluginCode = path.basename(file, '.js');
          
          // 检查插件是否已注册
          const existingPlugin = await paymentPluginModel.findOne({
            where: { plugin_code: pluginCode }
          });
          
          if (!existingPlugin) {
            try {
              // 尝试加载插件获取信息
              const PluginClass = require(pluginPath);
              const tempPlugin = new PluginClass();
              
              if (tempPlugin.getPluginInfo) {
                const pluginInfo = tempPlugin.getPluginInfo();
                await this.registerPlugin({
                  ...pluginInfo,
                  plugin_code: pluginCode,
                  plugin_path: pluginPath
                });
              }
            } catch (error) {
              logger.warn('跳过无效插件文件', { 
                category: 'PLUGIN_MANAGER', 
                file,
                error: error.message 
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error('扫描插件目录失败', { 
        category: 'PLUGIN_MANAGER', 
        error 
      });
    }
  }

  /**
   * 加载启用的插件
   * @private
   */
  async _loadActivePlugins() {
    const activePlugins = await paymentPluginModel.findAll({
      where: { status: 'active' },
      order: [['load_priority', 'DESC']]
    });

    for (const pluginConfig of activePlugins) {
      try {
        await this._loadPlugin(pluginConfig);
      } catch (error) {
        logger.error('加载插件失败', { 
          category: 'PLUGIN_MANAGER', 
          pluginName: pluginConfig.plugin_name,
          error 
        });
        
        // 标记插件为错误状态
        await pluginConfig.update({
          status: 'error',
          last_error: error.message
        });
      }
    }
  }

  /**
   * 加载单个插件
   * @private
   */
  async _loadPlugin(pluginConfig) {
    try {
      const pluginPath = path.resolve(pluginConfig.plugin_path);
      const PluginClass = require(pluginPath);
      const plugin = new PluginClass();

      // 验证插件接口
      this._validatePluginInterface(plugin);

      // 初始化插件
      if (typeof plugin.initialize === 'function') {
        await plugin.initialize();
      }

      // 缓存插件实例
      this.plugins.set(pluginConfig.id, plugin);
      this.pluginConfigs.set(pluginConfig.id, pluginConfig);

      // 更新加载时间
      await pluginConfig.update({
        loaded_at: new Date(),
        status: 'active',
        last_error: null
      });

      logger.info('插件加载成功', { 
        category: 'PLUGIN_MANAGER', 
        pluginName: pluginConfig.plugin_name 
      });

      return plugin;
    } catch (error) {
      logger.error('插件加载失败', { 
        category: 'PLUGIN_MANAGER', 
        pluginName: pluginConfig.plugin_name,
        error 
      });
      throw error;
    }
  }

  /**
   * 验证插件接口
   * @private
   */
  _validatePluginInterface(plugin) {
    const requiredMethods = [
      'createOrder',
      'handleCallback',
      'verifyCallback',
      'queryOrder',
      'refund'
    ];

    for (const method of requiredMethods) {
      if (typeof plugin[method] !== 'function') {
        throw new Error(`插件缺少必要方法: ${method}`);
      }
    }
  }
}

module.exports = PluginManager;
