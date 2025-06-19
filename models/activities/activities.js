/**
 * 活动数据模型
 * 定义活动的基本信息和状态管理
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '活动ID'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '活动名称'
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '活动类型ID',
      references: {
        model: 'activity_types',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '活动描述/内容'
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '活动开始时间'
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '活动结束时间'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'cancelled'),
      defaultValue: 'draft',
      allowNull: false,
      comment: '活动状态：草稿、进行中、暂停、已完成、已取消'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '活动优先级，数字越大优先级越高'
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '最大参与人数，null表示无限制'
    },
    current_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '当前参与人数'
    },
    banner_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '活动横幅图片URL'
    },
    thumbnail_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '活动缩略图URL'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '活动地点'
    },
    organizer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '活动组织者用户ID',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '活动标签，JSON数组格式'
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '活动设置，JSON格式存储各种配置'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为推荐活动'
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否公开活动'
    },
    registration_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否需要报名'
    },
    registration_deadline: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '报名截止时间'
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
    tableName: 'activities',
    timestamps: false,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['type_id']
      },
      {
        fields: ['start_time']
      },
      {
        fields: ['end_time']
      },
      {
        fields: ['organizer_id']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['is_featured']
      },
      {
        fields: ['is_public']
      }
    ],
    hooks: {
      beforeUpdate: (activity, options) => {
        activity.updated_at = new Date();
      }
    }
  });

  // 定义关联关系
  Activity.associate = function(models) {
    // 活动属于某个活动类型
    Activity.belongsTo(models.ActivityType, {
      foreignKey: 'type_id',
      as: 'activityType'
    });

    // 活动属于某个组织者
    Activity.belongsTo(models.User, {
      foreignKey: 'organizer_id',
      as: 'organizer'
    });

    // 活动由某个用户创建
    Activity.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    // 活动由某个用户最后更新
    Activity.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updater'
    });

    // 活动有多个通知配置
    Activity.hasMany(models.ActivityNotification, {
      foreignKey: 'activity_id',
      as: 'notifications'
    });
  };

  // 实例方法
  Activity.prototype.isActive = function() {
    const now = new Date();
    return this.status === 'active' && 
           this.start_time <= now && 
           this.end_time >= now;
  };

  Activity.prototype.isUpcoming = function() {
    const now = new Date();
    return this.start_time > now;
  };

  Activity.prototype.isExpired = function() {
    const now = new Date();
    return this.end_time < now;
  };

  Activity.prototype.canRegister = function() {
    if (!this.registration_required) return false;
    if (this.registration_deadline && new Date() > this.registration_deadline) return false;
    if (this.max_participants && this.current_participants >= this.max_participants) return false;
    return this.status === 'active' && this.isUpcoming();
  };

  // 类方法
  Activity.getActiveActivities = function() {
    const now = new Date();
    return this.findAll({
      where: {
        status: 'active',
        start_time: { [sequelize.Sequelize.Op.lte]: now },
        end_time: { [sequelize.Sequelize.Op.gte]: now }
      }
    });
  };

  Activity.getUpcomingActivities = function(limit = 10) {
    const now = new Date();
    return this.findAll({
      where: {
        status: 'active',
        start_time: { [sequelize.Sequelize.Op.gt]: now }
      },
      order: [['start_time', 'ASC']],
      limit
    });
  };

  return Activity;
};
