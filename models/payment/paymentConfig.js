const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentConfig:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 配置ID
 *         channel_id:
 *           type: integer
 *           description: 支付渠道ID
 *         config_key:
 *           type: string
 *           description: 配置键名
 *         config_value:
 *           type: string
 *           description: 配置值
 *         is_encrypted:
 *           type: boolean
 *           description: 是否加密存储
 *         description:
 *           type: string
 *           description: 配置描述
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = (sequelize) => {
  const PaymentConfig = sequelize.define('PaymentConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '配置ID'
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '支付渠道ID'
    },
    config_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '配置键名，如：api_key, secret_key, gateway_url等'
    },
    config_value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '配置值'
    },
    is_encrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否加密存储，敏感信息如密钥应加密'
    },
    description: {
      type: DataTypes.STRING(255),
      comment: '配置描述'
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
    tableName: 'payment_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['channel_id', 'config_key']
      },
      {
        fields: ['channel_id']
      }
    ],
    comment: '支付渠道配置表'
  });

  return PaymentConfig;
};
