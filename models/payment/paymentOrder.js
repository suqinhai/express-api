const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 订单ID
 *         order_no:
 *           type: string
 *           description: 订单号
 *         merchant_order_no:
 *           type: string
 *           description: 商户订单号
 *         channel_id:
 *           type: integer
 *           description: 支付渠道ID
 *         user_id:
 *           type: integer
 *           description: 用户ID
 *         amount:
 *           type: number
 *           description: 支付金额
 *         currency:
 *           type: string
 *           description: 货币类型
 *         status:
 *           type: string
 *           enum: [pending, processing, success, failed, cancelled, refunded]
 *           description: 订单状态
 *         payment_method:
 *           type: string
 *           description: 支付方式
 *         gateway_order_no:
 *           type: string
 *           description: 网关订单号
 *         notify_url:
 *           type: string
 *           description: 异步通知地址
 *         return_url:
 *           type: string
 *           description: 同步返回地址
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = (sequelize) => {
  const PaymentOrder = sequelize.define('PaymentOrder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '订单ID'
    },
    order_no: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '系统订单号，全局唯一'
    },
    merchant_order_no: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '商户订单号'
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '支付渠道ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
      comment: '用户ID，可为空（游客支付）'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '支付金额'
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD',
      comment: '货币类型'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'),
      defaultValue: 'pending',
      allowNull: false,
      comment: '订单状态'
    },
    payment_method: {
      type: DataTypes.STRING(50),
      comment: '具体支付方式，如：alipay, wechat, bank_card等'
    },
    gateway_order_no: {
      type: DataTypes.STRING(128),
      comment: '第三方支付网关订单号'
    },
    gateway_trade_no: {
      type: DataTypes.STRING(128),
      comment: '第三方支付网关交易号'
    },
    subject: {
      type: DataTypes.STRING(255),
      comment: '订单标题'
    },
    body: {
      type: DataTypes.TEXT,
      comment: '订单描述'
    },
    notify_url: {
      type: DataTypes.STRING(500),
      comment: '异步通知地址'
    },
    return_url: {
      type: DataTypes.STRING(500),
      comment: '同步返回地址'
    },
    extra_params: {
      type: DataTypes.TEXT,
      comment: '额外参数，JSON格式'
    },
    fee_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      comment: '手续费金额'
    },
    actual_amount: {
      type: DataTypes.DECIMAL(15, 2),
      comment: '实际支付金额'
    },
    paid_at: {
      type: DataTypes.DATE,
      comment: '支付完成时间'
    },
    expired_at: {
      type: DataTypes.DATE,
      comment: '订单过期时间'
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
    tableName: 'payment_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['order_no']
      },
      {
        fields: ['merchant_order_no']
      },
      {
        fields: ['channel_id', 'status']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['gateway_order_no']
      },
      {
        fields: ['status', 'created_at']
      }
    ],
    comment: '支付订单表'
  });

  return PaymentOrder;
};
