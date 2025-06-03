const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RegisterConfig = sequelize.define('RegisterConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    realNameVerification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '真实姓名验证开启状态'
    },
    realNameRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '真实姓名是否必填'
    },
    phoneVerification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '手机验证开启状态'
    },
    phoneRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '手机是否必填'
    },
    phoneVerificationCode: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否开启手机验证码'
    },
    captchaType: {
      type: DataTypes.ENUM('none', 'image', 'number'),
      defaultValue: 'none',
      comment: '验证码类型：无/图形验证码/数字验证码'
    },
    googleAuthEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '谷歌授权开启状态'
    },
    googleAppId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '谷歌应用ID'
    },
    googleSecret: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '谷歌应用密钥'
    },
    facebookAuthEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Facebook授权开启状态'
    },
    facebookAppId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Facebook应用ID'
    },
    facebookSecret: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Facebook应用密钥'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'register_configs',
    timestamps: false
  });

  return RegisterConfig;
}; 