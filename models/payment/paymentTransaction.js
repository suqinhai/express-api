const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentTransaction = sequelize.define('PaymentTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '交易记录ID'
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '关联的订单ID'
    },
    transaction_no: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '交易流水号'
    },
    type: {
      type: DataTypes.ENUM('payment', 'refund', 'chargeback'),
      allowNull: false,
      comment: '交易类型：payment-支付，refund-退款，chargeback-拒付'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '交易金额'
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: '货币类型'
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
      allowNull: false,
      comment: '交易状态'
    },
    gateway_transaction_no: {
      type: DataTypes.STRING(128),
      comment: '网关交易号'
    },
    gateway_response: {
      type: DataTypes.TEXT,
      comment: '网关响应数据，JSON格式'
    },
    error_code: {
      type: DataTypes.STRING(50),
      comment: '错误代码'
    },
    error_message: {
      type: DataTypes.TEXT,
      comment: '错误信息'
    },
    processed_at: {
      type: DataTypes.DATE,
      comment: '处理完成时间'
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
    tableName: 'payment_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['transaction_no'] },
      { fields: ['order_id'] },
      { fields: ['type', 'status'] },
      { fields: ['gateway_transaction_no'] },
      { fields: ['created_at'] }
    ],
    comment: '支付交易记录表'
  });

  return PaymentTransaction;
};
