const { sequelize } = require('../common/index');
const userModel = require('./users/user');
const registerConfigModel = require('./users/registerConfig');

// 支付相关模型
const paymentChannelModel = require('./payment/paymentChannel');
const paymentConfigModel = require('./payment/paymentConfig');
const paymentOrderModel = require('./payment/paymentOrder');
const paymentTransactionModel = require('./payment/paymentTransaction');
const paymentCallbackModel = require('./payment/paymentCallback');
const paymentPluginModel = require('./payment/paymentPlugin');

// 初始化模型
const models = {
  userModel: userModel(sequelize),
  registerConfigModel: registerConfigModel(sequelize),
  // 支付模型
  paymentChannelModel: paymentChannelModel(sequelize),
  paymentConfigModel: paymentConfigModel(sequelize),
  paymentOrderModel: paymentOrderModel(sequelize),
  paymentTransactionModel: paymentTransactionModel(sequelize),
  paymentCallbackModel: paymentCallbackModel(sequelize),
  paymentPluginModel: paymentPluginModel(sequelize),
};

// 建立模型关联关系
const setupAssociations = () => {
  // 支付渠道与配置的关联
  models.paymentChannelModel.hasMany(models.paymentConfigModel, {
    foreignKey: 'channel_id',
    as: 'configs'
  });
  models.paymentConfigModel.belongsTo(models.paymentChannelModel, {
    foreignKey: 'channel_id',
    as: 'channel'
  });

  // 支付订单与交易记录的关联
  models.paymentOrderModel.hasMany(models.paymentTransactionModel, {
    foreignKey: 'order_id',
    as: 'transactions'
  });
  models.paymentTransactionModel.belongsTo(models.paymentOrderModel, {
    foreignKey: 'order_id',
    as: 'order'
  });

  // 支付订单与回调日志的关联
  models.paymentOrderModel.hasMany(models.paymentCallbackModel, {
    foreignKey: 'order_id',
    as: 'callbacks'
  });
  models.paymentCallbackModel.belongsTo(models.paymentOrderModel, {
    foreignKey: 'order_id',
    as: 'order'
  });

  // 支付渠道与插件的关联
  models.paymentChannelModel.belongsTo(models.paymentPluginModel, {
    foreignKey: 'plugin_id',
    as: 'plugin'
  });
  models.paymentPluginModel.hasMany(models.paymentChannelModel, {
    foreignKey: 'plugin_id',
    as: 'channels'
  });
};

// 执行关联设置
setupAssociations();

// 导出模型和 Sequelize 实例
module.exports = {
  ...models,
  sequelize,
};
