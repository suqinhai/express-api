/**
 * 活动控制器
 * 处理活动相关的HTTP请求和响应
 */

const ActivityService = require('../services/activities/ActivityService');
const logger = require('../common/logger');
const { validationResult } = require('express-validator');

class ActivityController {
  constructor() {
    // 绑定方法到实例，确保this指向正确
    this.getActivities = this.getActivities.bind(this);
    this.getActivityById = this.getActivityById.bind(this);
    this.createActivity = this.createActivity.bind(this);
    this.updateActivity = this.updateActivity.bind(this);
    this.deleteActivity = this.deleteActivity.bind(this);
    this.updateActivityStatus = this.updateActivityStatus.bind(this);
    this.getActivityTypes = this.getActivityTypes.bind(this);
    this.getActiveActivities = this.getActiveActivities.bind(this);
    this.getUpcomingActivities = this.getUpcomingActivities.bind(this);
  }

  /**
   * 获取活动服务实例
   * @param {Object} req - 请求对象
   * @returns {ActivityService} 活动服务实例
   */
  getActivityService(req) {
    return new ActivityService(req.sequelize || req.app.locals.sequelize);
  }

  /**
   * 获取活动列表
   * @route GET /api/activities
   */
  async getActivities(req, res) {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.sendBadRequest('参数验证失败', errors.array());
      }

      const {
        page = 1,
        limit = 10,
        status,
        type_id,
        search,
        sort = 'created_at',
        order = 'DESC'
      } = req.query;

      const activityService = this.getActivityService(req);
      const result = await activityService.getActivities({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type_id: type_id ? parseInt(type_id) : undefined,
        search,
        sort,
        order
      });

      return res.sendSuccess('获取活动列表成功', result);
    } catch (error) {
      logger.error('获取活动列表失败:', error);
      return res.sendServerError('获取活动列表失败');
    }
  }

  /**
   * 获取活动详情
   * @route GET /api/activities/:id
   */
  async getActivityById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.sendBadRequest('无效的活动ID');
      }

      const activityService = this.getActivityService(req);
      const activity = await activityService.getActivityById(parseInt(id));

      if (!activity) {
        return res.sendNotFound('活动不存在');
      }

      return res.sendSuccess('获取活动详情成功', activity);
    } catch (error) {
      logger.error('获取活动详情失败:', error);
      return res.sendServerError('获取活动详情失败');
    }
  }

  /**
   * 创建新活动
   * @route POST /api/activities
   */
  async createActivity(req, res) {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.sendBadRequest('参数验证失败', errors.array());
      }

      const userId = req.user.id;
      const activityData = req.body;

      const activityService = this.getActivityService(req);
      const activity = await activityService.createActivity(activityData, userId);

      return res.sendSuccess('创建活动成功', activity, 201);
    } catch (error) {
      logger.error('创建活动失败:', error);
      
      // 处理特定的业务错误
      if (error.message.includes('活动类型不存在') || 
          error.message.includes('时间必须早于')) {
        return res.sendBadRequest(error.message);
      }
      
      return res.sendServerError('创建活动失败');
    }
  }

  /**
   * 更新活动
   * @route PUT /api/activities/:id
   */
  async updateActivity(req, res) {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.sendBadRequest('参数验证失败', errors.array());
      }

      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.sendBadRequest('无效的活动ID');
      }

      const activityService = this.getActivityService(req);
      const activity = await activityService.updateActivity(parseInt(id), updateData, userId);

      return res.sendSuccess('更新活动成功', activity);
    } catch (error) {
      logger.error('更新活动失败:', error);
      
      // 处理特定的业务错误
      if (error.message.includes('活动不存在')) {
        return res.sendNotFound(error.message);
      }
      
      if (error.message.includes('活动类型不存在') || 
          error.message.includes('时间必须早于') ||
          error.message.includes('权限')) {
        return res.sendBadRequest(error.message);
      }
      
      return res.sendServerError('更新活动失败');
    }
  }

  /**
   * 删除活动
   * @route DELETE /api/activities/:id
   */
  async deleteActivity(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!id || isNaN(parseInt(id))) {
        return res.sendBadRequest('无效的活动ID');
      }

      const activityService = this.getActivityService(req);
      await activityService.deleteActivity(parseInt(id), userId);

      return res.sendSuccess('删除活动成功');
    } catch (error) {
      logger.error('删除活动失败:', error);
      
      // 处理特定的业务错误
      if (error.message.includes('活动不存在')) {
        return res.sendNotFound(error.message);
      }
      
      if (error.message.includes('进行中的活动不能删除') ||
          error.message.includes('权限')) {
        return res.sendBadRequest(error.message);
      }
      
      return res.sendServerError('删除活动失败');
    }
  }

  /**
   * 更新活动状态
   * @route PUT /api/activities/:id/status
   */
  async updateActivityStatus(req, res) {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.sendBadRequest('参数验证失败', errors.array());
      }

      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!id || isNaN(parseInt(id))) {
        return res.sendBadRequest('无效的活动ID');
      }

      const activityService = this.getActivityService(req);
      const activity = await activityService.updateActivityStatus(parseInt(id), status, userId);

      return res.sendSuccess('更新活动状态成功', activity);
    } catch (error) {
      logger.error('更新活动状态失败:', error);
      
      // 处理特定的业务错误
      if (error.message.includes('活动不存在')) {
        return res.sendNotFound(error.message);
      }
      
      if (error.message.includes('无效的活动状态') ||
          error.message.includes('不能从') ||
          error.message.includes('权限')) {
        return res.sendBadRequest(error.message);
      }
      
      return res.sendServerError('更新活动状态失败');
    }
  }

  /**
   * 获取活动类型列表
   * @route GET /api/activities/types
   */
  async getActivityTypes(req, res) {
    try {
      const activityService = this.getActivityService(req);
      const ActivityType = activityService.ActivityType;
      
      const types = await ActivityType.getActiveTypes();
      
      return res.sendSuccess('获取活动类型成功', types);
    } catch (error) {
      logger.error('获取活动类型失败:', error);
      return res.sendServerError('获取活动类型失败');
    }
  }

  /**
   * 获取当前进行中的活动
   * @route GET /api/activities/active
   */
  async getActiveActivities(req, res) {
    try {
      const activityService = this.getActivityService(req);
      const activities = await activityService.Activity.getActiveActivities();
      
      return res.sendSuccess('获取进行中活动成功', activities);
    } catch (error) {
      logger.error('获取进行中活动失败:', error);
      return res.sendServerError('获取进行中活动失败');
    }
  }

  /**
   * 获取即将开始的活动
   * @route GET /api/activities/upcoming
   */
  async getUpcomingActivities(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const activityService = this.getActivityService(req);
      const activities = await activityService.Activity.getUpcomingActivities(parseInt(limit));
      
      return res.sendSuccess('获取即将开始活动成功', activities);
    } catch (error) {
      logger.error('获取即将开始活动失败:', error);
      return res.sendServerError('获取即将开始活动失败');
    }
  }
}

module.exports = new ActivityController();
