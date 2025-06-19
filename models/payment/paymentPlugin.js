const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentPlugin = sequelize.define('PaymentPlugin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '插件ID'
    },
    plugin_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '插件名称'
    },
    plugin_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '插件代码标识'
    },
    plugin_version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0',
      comment: '插件版本号'
    },
    plugin_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '插件文件路径'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'error'),
      defaultValue: 'active',
      allowNull: false,
      comment: '插件状态：active-启用，inactive-禁用，error-错误'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '插件描述'
    },
    author: {
      type: DataTypes.STRING(100),
      comment: '插件作者'
    },
    config_schema: {
      type: DataTypes.TEXT,
      comment: '配置项架构，JSON格式定义插件需要的配置参数'
    },
    supported_methods: {
      type: DataTypes.TEXT,
      comment: '支持的支付方式，JSON数组格式'
    },
    supported_currencies: {
      type: DataTypes.TEXT,
      comment: '支持的货币类型，JSON数组格式'
    },
    load_priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '加载优先级，数值越大优先级越高'
    },
    last_error: {
      type: DataTypes.TEXT,
      comment: '最后一次错误信息'
    },
    loaded_at: {
      type: DataTypes.DATE,
      comment: '最后加载时间'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    tableName: 'payment_plugins',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['plugin_name'] },
      { unique: true, fields: ['plugin_code'] },
      { fields: ['status'] },
      { fields: ['load_priority'] }
    ],
    comment: '支付插件注册表'
  });

  return PaymentPlugin;
};
