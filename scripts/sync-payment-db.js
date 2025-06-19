const { sequelize } = require('../models');
const { logger } = require('../common/logger');

/**
 * 同步支付相关数据库表
 */
async function syncPaymentDatabase() {
  try {
    logger.info('开始同步支付数据库表...', { category: 'DB_SYNC' });

    // 同步所有模型到数据库
    await sequelize.sync({ 
      force: false, // 设置为true会删除现有表重新创建，谨慎使用
      alter: true   // 自动修改表结构以匹配模型定义
    });

    logger.info('支付数据库表同步完成', { category: 'DB_SYNC' });

    // 插入默认数据
    await insertDefaultData();

    logger.info('支付系统初始化完成', { category: 'DB_SYNC' });

  } catch (error) {
    logger.error('支付数据库同步失败', { category: 'DB_SYNC', error });
    throw error;
  }
}

/**
 * 插入默认数据
 */
async function insertDefaultData() {
  try {
    const { 
      paymentPluginModel, 
      paymentChannelModel, 
      paymentConfigModel 
    } = require('../models');

    // 检查并插入默认插件
    const existingPlugin = await paymentPluginModel.findOne({
      where: { plugin_code: 'UsdtPay' }
    });

    if (!existingPlugin) {
      logger.info('插入默认UsdtPay插件...', { category: 'DB_SYNC' });
      
      const plugin = await paymentPluginModel.create({
        plugin_name: 'UsdtPay',
        plugin_code: 'UsdtPay',
        plugin_version: '1.0.0',
        plugin_path: './plugins/payment/UsdtPay.js',
        status: 'active',
        description: 'USDT数字货币支付插件，支持TRC20、ERC20、OMNI协议',
        author: 'Payment Team',
        config_schema: JSON.stringify({
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
        }),
        supported_methods: JSON.stringify(['usdt_trc20', 'usdt_erc20', 'usdt_omni']),
        supported_currencies: JSON.stringify(['USDT', 'USD']),
        load_priority: 100
      });

      // 创建默认USDT支付渠道
      const channel = await paymentChannelModel.create({
        channel_code: 'UsdtPay',
        channel_name: 'USDT支付',
        plugin_id: plugin.id,
        status: 'inactive', // 默认禁用，需要配置后启用
        priority: 100,
        supported_currencies: JSON.stringify(['USDT', 'USD']),
        min_amount: 1.00,
        max_amount: 50000.00,
        fee_rate: 0.0200, // 2%手续费
        description: 'USDT数字货币支付渠道'
      });

      // 插入示例配置（需要管理员后续修改）
      const configs = [
        {
          channel_id: channel.id,
          config_key: 'merchant_id',
          config_value: 'YOUR_MERCHANT_ID',
          is_encrypted: false,
          description: '商户ID，请联系UsdtPay获取'
        },
        {
          channel_id: channel.id,
          config_key: 'api_key',
          config_value: 'YOUR_API_KEY',
          is_encrypted: true,
          description: 'API密钥，请联系UsdtPay获取'
        },
        {
          channel_id: channel.id,
          config_key: 'secret_key',
          config_value: 'YOUR_SECRET_KEY',
          is_encrypted: true,
          description: '签名密钥，请联系UsdtPay获取'
        },
        {
          channel_id: channel.id,
          config_key: 'gateway_url',
          config_value: 'https://api.usdtpay.com',
          is_encrypted: false,
          description: 'UsdtPay网关地址'
        },
        {
          channel_id: channel.id,
          config_key: 'callback_url',
          config_value: 'http://localhost:3000/api/payment/callback/UsdtPay',
          is_encrypted: false,
          description: '支付回调地址'
        },
        {
          channel_id: channel.id,
          config_key: 'timeout',
          config_value: '30',
          is_encrypted: false,
          description: '请求超时时间(秒)'
        },
        {
          channel_id: channel.id,
          config_key: 'default_protocol',
          config_value: 'TRC20',
          is_encrypted: false,
          description: '默认USDT协议'
        }
      ];

      await paymentConfigModel.bulkCreate(configs);

      logger.info('默认UsdtPay插件和渠道创建完成', { 
        category: 'DB_SYNC',
        pluginId: plugin.id,
        channelId: channel.id
      });
    }

    logger.info('默认数据检查完成', { category: 'DB_SYNC' });

  } catch (error) {
    logger.error('插入默认数据失败', { category: 'DB_SYNC', error });
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    await syncPaymentDatabase();
    
    console.log('\n=== 支付系统数据库同步完成 ===');
    console.log('1. 数据库表已创建/更新');
    console.log('2. 默认UsdtPay插件已安装');
    console.log('3. 请通过管理API配置支付渠道参数');
    console.log('4. 配置完成后启用支付渠道');
    console.log('\n管理API文档: http://localhost:3000/api-docs');
    console.log('支付API示例:');
    console.log('  创建订单: POST /api/payment/create');
    console.log('  查询订单: GET /api/payment/query/{orderNo}');
    console.log('  获取渠道: GET /api/payment/channels');
    console.log('\n管理API示例:');
    console.log('  渠道管理: GET /api/payment/admin/channels');
    console.log('  配置管理: GET /api/payment/admin/channels/{id}/configs');
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('数据库同步失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  syncPaymentDatabase,
  insertDefaultData
};
