/**
 * 活动路由 - 主路由文件
 * 定义活动相关的API路由
 */

const express = require('express');
const router = express.Router();
const ActivityController = require('../../controllers/ActivityController');
const { validateUser, validateAdmin } = require('../../middleware/auth');
const { activityValidation } = require('../../middleware/activities/validation');
const { asyncHandler } = require('../../common/routeHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       required:
 *         - name
 *         - type_id
 *         - start_time
 *         - end_time
 *       properties:
 *         id:
 *           type: integer
 *           description: 活动ID
 *         name:
 *           type: string
 *           description: 活动名称
 *         type_id:
 *           type: integer
 *           description: 活动类型ID
 *         description:
 *           type: string
 *           description: 活动描述
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: 活动开始时间
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: 活动结束时间
 *         status:
 *           type: string
 *           enum: [draft, active, paused, completed, cancelled]
 *           description: 活动状态
 *         location:
 *           type: string
 *           description: 活动地点
 *         max_participants:
 *           type: integer
 *           description: 最大参与人数
 *         current_participants:
 *           type: integer
 *           description: 当前参与人数
 *         is_featured:
 *           type: boolean
 *           description: 是否为推荐活动
 *         is_public:
 *           type: boolean
 *           description: 是否公开活动
 *         registration_required:
 *           type: boolean
 *           description: 是否需要报名
 *         registration_deadline:
 *           type: string
 *           format: date-time
 *           description: 报名截止时间
 *     ActivityType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 活动类型ID
 *         name:
 *           type: string
 *           description: 活动类型名称
 *         code:
 *           type: string
 *           description: 活动类型代码
 *         icon:
 *           type: string
 *           description: 活动类型图标
 *         color:
 *           type: string
 *           description: 活动类型颜色
 */

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: 获取活动列表
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, paused, completed, cancelled]
 *         description: 活动状态筛选
 *       - in: query
 *         name: type_id
 *         schema:
 *           type: integer
 *         description: 活动类型筛选
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at
 *         description: 排序字段
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 获取活动列表成功
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
 *                   example: 获取活动列表成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     activities:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Activity'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/', 
  validateUser, 
  activityValidation.getActivities,
  asyncHandler(ActivityController.getActivities)
);

/**
 * @swagger
 * /api/activities/types:
 *   get:
 *     summary: 获取活动类型列表
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取活动类型成功
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
 *                   example: 获取活动类型成功
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityType'
 */
router.get('/types', 
  validateUser, 
  asyncHandler(ActivityController.getActivityTypes)
);

/**
 * @swagger
 * /api/activities/active:
 *   get:
 *     summary: 获取当前进行中的活动
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取进行中活动成功
 */
router.get('/active', 
  validateUser, 
  asyncHandler(ActivityController.getActiveActivities)
);

/**
 * @swagger
 * /api/activities/upcoming:
 *   get:
 *     summary: 获取即将开始的活动
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 获取即将开始活动成功
 */
router.get('/upcoming', 
  validateUser, 
  asyncHandler(ActivityController.getUpcomingActivities)
);

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: 获取活动详情
 *     tags: [Activities]
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
 *         description: 获取活动详情成功
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
 *                   example: 获取活动详情成功
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: 活动不存在
 */
router.get('/:id', 
  validateUser, 
  asyncHandler(ActivityController.getActivityById)
);

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: 创建新活动
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type_id
 *               - start_time
 *               - end_time
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
 *     responses:
 *       201:
 *         description: 创建活动成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 */
router.post('/', 
  validateUser, 
  activityValidation.createActivity,
  asyncHandler(ActivityController.createActivity)
);

module.exports = router;
