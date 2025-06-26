const express = require('express');
const router = express.Router();
const { stacks, factories } = require('../../../middleware');
const { AdminSystemController } = require('../../../controllers');

// 创建控制器实例
const adminSystemController = new AdminSystemController();

/**
 * @swagger
 * tags:
 *   name: Admin System
 *   description: 管理端系统管理接口
 */

/**
 * @swagger
 * /api/admin/system/info:
 *   get:
 *     summary: 获取系统信息
 *     description: 管理员获取系统运行状态和基本信息
 *     tags: [Admin System]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取系统信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "获取系统信息成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     uptime:
 *                       type: number
 *                       description: 系统运行时间（秒）
 *                       example: 86400
 *                     environment:
 *                       type: string
 *                       example: "production"
 *                     nodeVersion:
 *                       type: string
 *                       example: "18.17.0"
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                           description: 已使用内存（MB）
 *                         total:
 *                           type: number
 *                           description: 总内存（MB）
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/info', factories.createAdminPermissionStack(['system:read']), adminSystemController.getSystemInfo);

/**
 * @swagger
 * /api/admin/system/stats:
 *   get:
 *     summary: 获取系统统计信息
 *     description: 管理员获取系统使用统计数据
 *     tags: [Admin System]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "获取统计信息成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 1000
 *                         active:
 *                           type: integer
 *                           example: 800
 *                         newToday:
 *                           type: integer
 *                           example: 10
 *                     requests:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 50000
 *                         today:
 *                           type: integer
 *                           example: 1200
 *                         avgResponseTime:
 *                           type: number
 *                           example: 150.5
 */
router.get('/statistics', factories.createAdminPermissionStack(['system:read']), adminSystemController.getSystemStatistics);

/**
 * @swagger
 * /api/admin/system/logs:
 *   get:
 *     summary: 获取系统日志
 *     description: 管理员获取系统运行日志
 *     tags: [Admin System]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: 日志级别筛选
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: 返回日志条数
 *     responses:
 *       200:
 *         description: 成功获取日志
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "获取系统日志成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           level:
 *                             type: string
 *                           message:
 *                             type: string
 *                           meta:
 *                             type: object
 */
router.get('/logs', factories.createAdminPermissionStack(['system:read']), adminSystemController.getSystemLogs);

/**
 * @swagger
 * /api/admin/system/cache/clear:
 *   post:
 *     summary: 清除系统缓存
 *     description: 管理员清除系统缓存（敏感操作）
 *     tags: [Admin System]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cacheType:
 *                 type: string
 *                 enum: [all, user, config, api]
 *                 default: all
 *                 description: 要清除的缓存类型
 *     responses:
 *       200:
 *         description: 缓存清除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/cache/clear', stacks.admin.sensitive, adminSystemController.clearSystemCache);

// 添加更多路由
router.get('/health', factories.createAdminPermissionStack(['system:read']), adminSystemController.getHealthStatus);
router.get('/config', factories.createAdminPermissionStack(['system:read']), adminSystemController.getSystemConfig);
router.put('/config', stacks.admin.sensitive, adminSystemController.updateSystemConfig);
router.post('/restart', stacks.admin.superAdmin, adminSystemController.restartApplication);
router.get('/api-stats', factories.createAdminPermissionStack(['system:read']), adminSystemController.getApiStatistics);
router.post('/export', stacks.admin.superAdmin, adminSystemController.exportSystemData);
router.get('/performance', factories.createAdminPermissionStack(['system:read']), adminSystemController.getPerformanceMetrics);

module.exports = router;
