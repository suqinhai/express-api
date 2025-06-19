/**
 * 活动服务层
 * 处理活动相关的业务逻辑
 */

const { Op } = require('sequelize');
const { CacheManager, PREFIX, TTL } = require('../../common/redis');
const logger = require('../../common/logger');

class ActivityService {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.Activity = sequelize.models.Activity;
    this.ActivityType = sequelize.models.ActivityType;
    this.ActivityNotification = sequelize.models.ActivityNotification;
    this.User = sequelize.models.User;
  }

  /**
   * 获取活动列表
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页数量
   * @param {string} options.status - 活动状态筛选
   * @param {number} options.type_id - 活动类型筛选
   * @param {string} options.search - 搜索关键词
   * @param {string} options.sort - 排序字段
   * @param {string} options.order - 排序方向
   * @returns {Promise<Object>} 活动列表和分页信息
   */
  async getActivities(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      type_id,
      search,
      sort = 'created_at',
      order = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 活动类型筛选
    if (type_id) {
      where.type_id = type_id;
    }

    // 搜索功能
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

    const cacheKey = `activities:list:${JSON.stringify({ where, offset, limit, sort, order })}`;
    
    return await CacheManager.getOrFetch(
      PREFIX.ACTIVITY,
      cacheKey,
      async () => {
        const { count, rows } = await this.Activity.findAndCountAll({
          where,
          include: [
            {
              model: this.ActivityType,
              as: 'activityType',
              attributes: ['id', 'name', 'code', 'icon', 'color']
            },
            {
              model: this.User,
              as: 'organizer',
              attributes: ['id', 'username', 'email']
            },
            {
              model: this.User,
              as: 'creator',
              attributes: ['id', 'username']
            }
          ],
          order: [[sort, order]],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });

        return {
          activities: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        };
      },
      TTL.SHORT
    );
  }

  /**
   * 根据ID获取活动详情
   * @param {number} id - 活动ID
   * @returns {Promise<Object|null>} 活动详情
   */
  async getActivityById(id) {
    return await CacheManager.getOrFetch(
      PREFIX.ACTIVITY,
      `detail:${id}`,
      async () => {
        return await this.Activity.findByPk(id, {
          include: [
            {
              model: this.ActivityType,
              as: 'activityType'
            },
            {
              model: this.User,
              as: 'organizer',
              attributes: ['id', 'username', 'email']
            },
            {
              model: this.User,
              as: 'creator',
              attributes: ['id', 'username']
            },
            {
              model: this.User,
              as: 'updater',
              attributes: ['id', 'username']
            },
            {
              model: this.ActivityNotification,
              as: 'notifications',
              where: { is_enabled: true },
              required: false
            }
          ]
        });
      },
      TTL.MEDIUM
    );
  }

  /**
   * 创建新活动
   * @param {Object} activityData - 活动数据
   * @param {number} userId - 创建者用户ID
   * @returns {Promise<Object>} 创建的活动
   */
  async createActivity(activityData, userId) {
    const transaction = await this.sequelize.transaction();

    try {
      // 验证活动类型是否存在
      const activityType = await this.ActivityType.findByPk(activityData.type_id);
      if (!activityType || !activityType.is_active) {
        throw new Error('活动类型不存在或已禁用');
      }

      // 验证时间逻辑
      if (new Date(activityData.start_time) >= new Date(activityData.end_time)) {
        throw new Error('活动开始时间必须早于结束时间');
      }

      // 设置创建者信息
      const createData = {
        ...activityData,
        created_by: userId,
        organizer_id: activityData.organizer_id || userId
      };

      // 创建活动
      const activity = await this.Activity.create(createData, { transaction });

      // 创建默认通知配置
      await this.createDefaultNotifications(activity.id, activityType, userId, transaction);

      await transaction.commit();

      // 清除相关缓存
      await this.clearActivityCache();

      logger.info(`活动创建成功: ${activity.id}`, { userId, activityId: activity.id });

      return await this.getActivityById(activity.id);
    } catch (error) {
      await transaction.rollback();
      logger.error('创建活动失败:', error);
      throw error;
    }
  }

  /**
   * 更新活动
   * @param {number} id - 活动ID
   * @param {Object} updateData - 更新数据
   * @param {number} userId - 更新者用户ID
   * @returns {Promise<Object>} 更新后的活动
   */
  async updateActivity(id, updateData, userId) {
    const transaction = await this.sequelize.transaction();

    try {
      const activity = await this.Activity.findByPk(id);
      if (!activity) {
        throw new Error('活动不存在');
      }

      // 验证权限（只有创建者、组织者或管理员可以更新）
      // 这里简化处理，实际应该在中间件中处理权限验证

      // 验证活动类型（如果要更新类型）
      if (updateData.type_id && updateData.type_id !== activity.type_id) {
        const activityType = await this.ActivityType.findByPk(updateData.type_id);
        if (!activityType || !activityType.is_active) {
          throw new Error('活动类型不存在或已禁用');
        }
      }

      // 验证时间逻辑
      const startTime = updateData.start_time || activity.start_time;
      const endTime = updateData.end_time || activity.end_time;
      if (new Date(startTime) >= new Date(endTime)) {
        throw new Error('活动开始时间必须早于结束时间');
      }

      // 更新活动
      await activity.update({
        ...updateData,
        updated_by: userId
      }, { transaction });

      await transaction.commit();

      // 清除相关缓存
      await this.clearActivityCache(id);

      logger.info(`活动更新成功: ${id}`, { userId, activityId: id });

      return await this.getActivityById(id);
    } catch (error) {
      await transaction.rollback();
      logger.error('更新活动失败:', error);
      throw error;
    }
  }

  /**
   * 删除活动
   * @param {number} id - 活动ID
   * @param {number} userId - 删除者用户ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteActivity(id, userId) {
    const transaction = await this.sequelize.transaction();

    try {
      const activity = await this.Activity.findByPk(id);
      if (!activity) {
        throw new Error('活动不存在');
      }

      // 验证权限（只有创建者或管理员可以删除）
      // 这里简化处理，实际应该在中间件中处理权限验证

      // 检查活动状态，进行中的活动不能直接删除
      if (activity.status === 'active' && activity.isActive()) {
        throw new Error('进行中的活动不能删除，请先暂停或取消活动');
      }

      // 删除相关通知配置
      await this.ActivityNotification.destroy({
        where: { activity_id: id },
        transaction
      });

      // 删除活动
      await activity.destroy({ transaction });

      await transaction.commit();

      // 清除相关缓存
      await this.clearActivityCache(id);

      logger.info(`活动删除成功: ${id}`, { userId, activityId: id });

      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error('删除活动失败:', error);
      throw error;
    }
  }

  /**
   * 更新活动状态
   * @param {number} id - 活动ID
   * @param {string} status - 新状态
   * @param {number} userId - 操作者用户ID
   * @returns {Promise<Object>} 更新后的活动
   */
  async updateActivityStatus(id, status, userId) {
    const validStatuses = ['draft', 'active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('无效的活动状态');
    }

    const activity = await this.Activity.findByPk(id);
    if (!activity) {
      throw new Error('活动不存在');
    }

    // 状态转换验证
    if (!this.isValidStatusTransition(activity.status, status)) {
      throw new Error(`不能从 ${activity.status} 状态转换到 ${status} 状态`);
    }

    await activity.update({
      status,
      updated_by: userId
    });

    // 清除相关缓存
    await this.clearActivityCache(id);

    logger.info(`活动状态更新: ${id} -> ${status}`, { userId, activityId: id });

    return await this.getActivityById(id);
  }

  /**
   * 创建默认通知配置
   * @param {number} activityId - 活动ID
   * @param {Object} activityType - 活动类型
   * @param {number} userId - 用户ID
   * @param {Object} transaction - 数据库事务
   */
  async createDefaultNotifications(activityId, activityType, userId, transaction) {
    const defaultSettings = activityType.getDefaultNotificationSettings();
    const notifications = [];

    // 创建开始前通知
    if (defaultSettings.advance_notice && defaultSettings.advance_notice.length > 0) {
      for (const minutes of defaultSettings.advance_notice) {
        notifications.push({
          activity_id: activityId,
          notification_type: 'system',
          trigger_type: 'before_start',
          trigger_time: minutes * 60, // 转换为分钟
          title: `活动即将开始`,
          content: `您参与的活动将在 ${minutes} 小时后开始`,
          target_audience: 'participants',
          created_by: userId
        });
      }
    }

    // 创建开始时通知
    notifications.push({
      activity_id: activityId,
      notification_type: 'system',
      trigger_type: 'at_start',
      title: '活动已开始',
      content: '您参与的活动现在开始了',
      target_audience: 'participants',
      created_by: userId
    });

    if (notifications.length > 0) {
      await this.ActivityNotification.bulkCreate(notifications, { transaction });
    }
  }

  /**
   * 验证状态转换是否有效
   * @param {string} currentStatus - 当前状态
   * @param {string} newStatus - 新状态
   * @returns {boolean} 是否有效
   */
  isValidStatusTransition(currentStatus, newStatus) {
    const transitions = {
      'draft': ['active', 'cancelled'],
      'active': ['paused', 'completed', 'cancelled'],
      'paused': ['active', 'cancelled'],
      'completed': [], // 已完成的活动不能再改变状态
      'cancelled': [] // 已取消的活动不能再改变状态
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * 清除活动相关缓存
   * @param {number} activityId - 活动ID（可选）
   */
  async clearActivityCache(activityId = null) {
    try {
      if (activityId) {
        await CacheManager.delete(PREFIX.ACTIVITY, `detail:${activityId}`);
      }
      
      // 清除列表缓存（使用模式匹配）
      await CacheManager.deletePattern(PREFIX.ACTIVITY, 'activities:list:*');
      
      logger.debug('活动缓存清除成功', { activityId });
    } catch (error) {
      logger.error('清除活动缓存失败:', error);
    }
  }
}

module.exports = ActivityService;
