/**
 * 活动通知配置数据模型
 * 定义活动的通知设置和时间配置
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityNotification = sequelize.define('ActivityNotification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '通知配置ID'
    },
    activity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '关联的活动ID',
      references: {
        model: 'activities',
        key: 'id'
      }
    },
    notification_type: {
      type: DataTypes.ENUM('email', 'sms', 'push', 'system'),
      allowNull: false,
      comment: '通知类型：邮件、短信、推送、系统通知'
    },
    trigger_type: {
      type: DataTypes.ENUM('before_start', 'at_start', 'before_end', 'at_end', 'custom'),
      allowNull: false,
      comment: '触发类型：开始前、开始时、结束前、结束时、自定义时间'
    },
    trigger_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '触发时间（分钟），相对于活动开始/结束时间的偏移量'
    },
    custom_trigger_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '自定义触发时间，当trigger_type为custom时使用'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '通知标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '通知内容'
    },
    template_variables: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '模板变量，JSON格式存储动态内容'
    },
    target_audience: {
      type: DataTypes.ENUM('all', 'participants', 'organizers', 'custom'),
      defaultValue: 'participants',
      comment: '目标受众：所有人、参与者、组织者、自定义'
    },
    target_users: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '目标用户ID列表，当target_audience为custom时使用'
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用该通知'
    },
    is_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已发送'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发送时间'
    },
    send_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '发送次数'
    },
    max_send_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: '最大发送尝试次数'
    },
    last_error: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '最后一次发送错误信息'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '通知优先级，数字越大优先级越高'
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '通知设置，JSON格式存储额外配置'
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
    tableName: 'activity_notifications',
    timestamps: false,
    indexes: [
      {
        fields: ['activity_id']
      },
      {
        fields: ['notification_type']
      },
      {
        fields: ['trigger_type']
      },
      {
        fields: ['is_enabled']
      },
      {
        fields: ['is_sent']
      },
      {
        fields: ['custom_trigger_time']
      },
      {
        fields: ['priority']
      }
    ],
    hooks: {
      beforeUpdate: (notification, options) => {
        notification.updated_at = new Date();
      }
    }
  });

  // 定义关联关系
  ActivityNotification.associate = function(models) {
    // 通知属于某个活动
    ActivityNotification.belongsTo(models.Activity, {
      foreignKey: 'activity_id',
      as: 'activity'
    });

    // 通知由某个用户创建
    ActivityNotification.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    // 通知由某个用户最后更新
    ActivityNotification.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updater'
    });
  };

  // 实例方法
  ActivityNotification.prototype.calculateTriggerTime = function() {
    if (this.trigger_type === 'custom') {
      return this.custom_trigger_time;
    }

    if (!this.activity) {
      throw new Error('Activity information is required to calculate trigger time');
    }

    let baseTime;
    switch (this.trigger_type) {
      case 'before_start':
      case 'at_start':
        baseTime = new Date(this.activity.start_time);
        break;
      case 'before_end':
      case 'at_end':
        baseTime = new Date(this.activity.end_time);
        break;
      default:
        throw new Error(`Unsupported trigger type: ${this.trigger_type}`);
    }

    if (this.trigger_time && (this.trigger_type === 'before_start' || this.trigger_type === 'before_end')) {
      baseTime.setMinutes(baseTime.getMinutes() - this.trigger_time);
    }

    return baseTime;
  };

  ActivityNotification.prototype.shouldSend = function() {
    if (!this.is_enabled || this.is_sent) return false;
    if (this.send_count >= this.max_send_attempts) return false;

    const triggerTime = this.calculateTriggerTime();
    return new Date() >= triggerTime;
  };

  ActivityNotification.prototype.markAsSent = function() {
    this.is_sent = true;
    this.sent_at = new Date();
    this.send_count += 1;
    return this.save();
  };

  ActivityNotification.prototype.recordError = function(error) {
    this.last_error = error.message || error;
    this.send_count += 1;
    return this.save();
  };

  // 类方法
  ActivityNotification.getPendingNotifications = function() {
    const now = new Date();
    return this.findAll({
      where: {
        is_enabled: true,
        is_sent: false,
        send_count: { [sequelize.Sequelize.Op.lt]: sequelize.Sequelize.col('max_send_attempts') }
      },
      include: [{
        model: this.sequelize.models.Activity,
        as: 'activity',
        required: true
      }]
    }).then(notifications => {
      return notifications.filter(notification => {
        try {
          const triggerTime = notification.calculateTriggerTime();
          return now >= triggerTime;
        } catch (error) {
          console.error('Error calculating trigger time for notification:', notification.id, error);
          return false;
        }
      });
    });
  };

  ActivityNotification.getNotificationsByActivity = function(activityId) {
    return this.findAll({
      where: { activity_id: activityId },
      order: [['priority', 'DESC'], ['trigger_time', 'ASC']]
    });
  };

  return ActivityNotification;
};
