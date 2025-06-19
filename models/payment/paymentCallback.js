const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentCallback = sequelize.define('PaymentCallback', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '回调记录ID'
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '关联的订单ID'
    },
    callback_type: {
      type: DataTypes.ENUM('notify', 'return', 'query'),
      allowNull: false,
      comment: '回调类型：notify-异步通知，return-同步返回，query-主动查询'
    },
    request_method: {
      type: DataTypes.STRING(10),
      comment: '请求方法：GET, POST等'
    },
    request_headers: {
      type: DataTypes.TEXT,
      comment: '请求头信息，JSON格式'
    },
    request_body: {
      type: DataTypes.TEXT,
      comment: '请求体内容'
    },
    request_params: {
      type: DataTypes.TEXT,
      comment: '请求参数，JSON格式'
    },
    response_status: {
      type: DataTypes.INTEGER,
      comment: 'HTTP响应状态码'
    },
    response_body: {
      type: DataTypes.TEXT,
      comment: '响应内容'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '签名验证是否通过'
    },
    is_processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已处理'
    },
    process_result: {
      type: DataTypes.TEXT,
      comment: '处理结果'
    },
    client_ip: {
      type: DataTypes.STRING(45),
      comment: '客户端IP地址'
    },
    user_agent: {
      type: DataTypes.TEXT,
      comment: '用户代理信息'
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
    tableName: 'payment_callbacks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['callback_type'] },
      { fields: ['is_verified', 'is_processed'] },
      { fields: ['created_at'] }
    ],
    comment: '支付回调日志表'
  });

  return PaymentCallback;
};
