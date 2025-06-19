const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentChannel:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 支付渠道ID
 *         channel_code:
 *           type: string
 *           description: 支付渠道代码
 *         channel_name:
 *           type: string
 *           description: 支付渠道名称
 *         plugin_id:
 *           type: integer
 *           description: 关联的插件ID
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *           description: 渠道状态
 *         priority:
 *           type: integer
 *           description: 优先级排序
 *         supported_currencies:
 *           type: string
 *           description: 支持的货币类型(JSON格式)
 *         min_amount:
 *           type: number
 *           description: 最小支付金额
 *         max_amount:
 *           type: number
 *           description: 最大支付金额
 *         fee_rate:
 *           type: number
 *           description: 手续费率
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = (sequelize) => {
  const PaymentChannel = sequelize.define('PaymentChannel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '支付渠道ID'
    },
    channel_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '支付渠道代码，如：UsdtPay, FastPay等'
    },
    channel_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '支付渠道名称'
    },
    plugin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '关联的插件ID'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active',
      allowNull: false,
      comment: '渠道状态：active-启用，inactive-禁用，maintenance-维护中'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '优先级排序，数值越大优先级越高'
    },
    supported_currencies: {
      type: DataTypes.TEXT,
      comment: '支持的货币类型，JSON格式存储，如：["USD","CNY","USDT"]'
    },
    min_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.01,
      comment: '最小支付金额'
    },
    max_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 999999.99,
      comment: '最大支付金额'
    },
    fee_rate: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 0.0000,
      comment: '手续费率，如：0.0300表示3%'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '渠道描述信息'
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
    tableName: 'payment_channels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['channel_code']
      },
      {
        fields: ['status', 'priority']
      },
      {
        fields: ['plugin_id']
      }
    ],
    comment: '支付渠道表'
  });

  return PaymentChannel;
};
