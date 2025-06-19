/**
 * 活动类型数据模型
 * 定义活动的分类和类型配置
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityType = sequelize.define('ActivityType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '活动类型ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '活动类型名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '活动类型代码，用于程序识别'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '活动类型描述'
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '活动类型图标URL或图标类名'
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      comment: '活动类型主题色，十六进制颜色值'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序顺序，数字越小越靠前'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用该活动类型'
    },
    default_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '默认活动持续时间（分钟）'
    },
    notification_settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '通知设置，JSON格式存储默认通知配置'
    },
    template_settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '模板设置，JSON格式存储活动模板配置'
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '权限设置，JSON格式存储谁可以创建此类型活动'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '创建者用户ID',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '最后更新者用户ID',
      references: {
        model: 'users',
        key: 'id'
      }
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
    tableName: 'activity_types',
    timestamps: false,
    indexes: [
      {
        fields: ['code'],
        unique: true
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['sort_order']
      }
    ],
    hooks: {
      beforeUpdate: (activityType, options) => {
        activityType.updated_at = new Date();
      },
      beforeCreate: (activityType, options) => {
        // 自动生成code如果没有提供
        if (!activityType.code && activityType.name) {
          activityType.code = activityType.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        }
      }
    }
  });

  // 定义关联关系
  ActivityType.associate = function(models) {
    // 活动类型有多个活动
    ActivityType.hasMany(models.Activity, {
      foreignKey: 'type_id',
      as: 'activities'
    });

    // 活动类型由某个用户创建
    ActivityType.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    // 活动类型由某个用户最后更新
    ActivityType.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updater'
    });
  };

  // 实例方法
  ActivityType.prototype.getDefaultNotificationSettings = function() {
    return this.notification_settings || {
      email: true,
      sms: false,
      push: true,
      advance_notice: [24, 1], // 提前24小时和1小时通知
      reminder_enabled: true
    };
  };

  ActivityType.prototype.getTemplateSettings = function() {
    return this.template_settings || {
      required_fields: ['name', 'start_time', 'end_time'],
      optional_fields: ['description', 'location'],
      default_values: {}
    };
  };

  // 类方法
  ActivityType.getActiveTypes = function() {
    return this.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
  };

  ActivityType.findByCode = function(code) {
    return this.findOne({
      where: { code, is_active: true }
    });
  };

  ActivityType.getTypesWithActivityCount = function() {
    return this.findAll({
      where: { is_active: true },
      include: [{
        model: this.sequelize.models.Activity,
        as: 'activities',
        attributes: []
      }],
      attributes: [
        'id', 'name', 'code', 'description', 'icon', 'color',
        [this.sequelize.fn('COUNT', this.sequelize.col('activities.id')), 'activity_count']
      ],
      group: ['ActivityType.id'],
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
  };

  return ActivityType;
};
