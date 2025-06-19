/**
 * 活动管理员路由
 * 定义需要管理员权限的活动管理API
 */

const express = require('express');
const router = express.Router();
const ActivityController = require('../../controllers/ActivityController');
const { validateAdmin } = require('../../middleware/auth');
const { activityValidation } = require('../../middleware/activities/validation');
const { asyncHandler } = require('../../common/routeHandler');

/**
 * @swagger
 * /api/activities/admin/{id}:
 *   put:
 *     summary: 更新活动（管理员）
 *     tags: [Activities Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 活动ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 活动名称
 *               type_id:
 *                 type: integer
 *                 description: 活动类型ID
 *               description:
 *                 type: string
 *                 description: 活动描述
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: 活动开始时间
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: 活动结束时间
 *               location:
 *                 type: string
 *                 description: 活动地点
 *               max_participants:
 *                 type: integer
 *                 description: 最大参与人数
 *               is_featured:
 *                 type: boolean
 *                 description: 是否为推荐活动
 *               is_public:
 *                 type: boolean
 *                 description: 是否公开活动
 *               registration_required:
 *                 type: boolean
 *                 description: 是否需要报名
 *               registration_deadline:
 *                 type: string
 *                 format: date-time
 *                 description: 报名截止时间
 *               priority:
 *                 type: integer
 *                 description: 活动优先级
 *               organizer_id:
 *                 type: integer
 *                 description: 组织者用户ID
 *     responses:
 *       200:
 *         description: 更新活动成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 更新活动成功
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 活动不存在
 */
router.put('/:id', 
  validateAdmin, 
  activityValidation.updateActivity,
  asyncHandler(ActivityController.updateActivity)
);

/**
 * @swagger
 * /api/activities/admin/{id}:
 *   delete:
 *     summary: 删除活动（管理员）
 *     tags: [Activities Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 活动ID
 *     responses:
 *       200:
 *         description: 删除活动成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 删除活动成功
 *       400:
 *         description: 参数错误或活动状态不允许删除
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 活动不存在
 */
router.delete('/:id', 
  validateAdmin, 
  asyncHandler(ActivityController.deleteActivity)
);

/**
 * @swagger
 * /api/activities/admin/{id}/status:
 *   put:
 *     summary: 更新活动状态（管理员）
 *     tags: [Activities Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 活动ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed, cancelled]
 *                 description: 新的活动状态
 *     responses:
 *       200:
 *         description: 更新活动状态成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 更新活动状态成功
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       400:
 *         description: 参数错误或状态转换无效
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 活动不存在
 */
router.put('/:id/status', 
  validateAdmin, 
  activityValidation.updateActivityStatus,
  asyncHandler(ActivityController.updateActivityStatus)
);

/**
 * @swagger
 * /api/activities/admin/batch/status:
 *   put:
 *     summary: 批量更新活动状态（管理员）
 *     tags: [Activities Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activity_ids
 *               - status
 *             properties:
 *               activity_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 活动ID数组
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed, cancelled]
 *                 description: 新的活动状态
 *     responses:
 *       200:
 *         description: 批量更新活动状态成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 */
router.put('/batch/status', 
  validateAdmin, 
  activityValidation.batchUpdateStatus,
  asyncHandler(async (req, res) => {
    try {
      const { activity_ids, status } = req.body;
      const userId = req.user.id;
      
      const activityService = new (require('../../services/activities/ActivityService'))(req.sequelize);
      
      const results = [];
      const errors = [];
      
      for (const activityId of activity_ids) {
        try {
          const activity = await activityService.updateActivityStatus(activityId, status, userId);
          results.push({ id: activityId, success: true, activity });
        } catch (error) {
          errors.push({ id: activityId, success: false, error: error.message });
        }
      }
      
      return res.sendSuccess('批量更新活动状态完成', {
        total: activity_ids.length,
        success: results.length,
        failed: errors.length,
        results,
        errors
      });
    } catch (error) {
      logger.error('批量更新活动状态失败:', error);
      return res.sendServerError('批量更新活动状态失败');
    }
  })
);

/**
 * @swagger
 * /api/activities/admin/statistics:
 *   get:
 *     summary: 获取活动统计信息（管理员）
 *     tags: [Activities Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取活动统计信息成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取活动统计信息成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: 总活动数
 *                     by_status:
 *                       type: object
 *                       description: 按状态分组的统计
 *                     by_type:
 *                       type: object
 *                       description: 按类型分组的统计
 *                     recent_activities:
 *                       type: array
 *                       description: 最近的活动
 */
router.get('/statistics', 
  validateAdmin, 
  asyncHandler(async (req, res) => {
    try {
      const activityService = new (require('../../services/activities/ActivityService'))(req.sequelize);
      const { Activity, ActivityType } = activityService;
      
      // 获取总数统计
      const total = await Activity.count();
      
      // 按状态统计
      const statusStats = await Activity.findAll({
        attributes: [
          'status',
          [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      // 按类型统计
      const typeStats = await Activity.findAll({
        attributes: [
          [Activity.sequelize.fn('COUNT', Activity.sequelize.col('Activity.id')), 'count']
        ],
        include: [{
          model: ActivityType,
          as: 'activityType',
          attributes: ['id', 'name', 'code']
        }],
        group: ['activityType.id']
      });
      
      // 最近的活动
      const recentActivities = await Activity.findAll({
        limit: 10,
        order: [['created_at', 'DESC']],
        include: [{
          model: ActivityType,
          as: 'activityType',
          attributes: ['name', 'code']
        }]
      });
      
      const statistics = {
        total,
        by_status: statusStats.reduce((acc, item) => {
          acc[item.status] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        by_type: typeStats.map(item => ({
          type: item.activityType,
          count: parseInt(item.dataValues.count)
        })),
        recent_activities: recentActivities
      };
      
      return res.sendSuccess('获取活动统计信息成功', statistics);
    } catch (error) {
      logger.error('获取活动统计信息失败:', error);
      return res.sendServerError('获取活动统计信息失败');
    }
  })
);

module.exports = router;
