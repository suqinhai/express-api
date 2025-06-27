// 引入Express框架，用于创建路由器
const express = require('express');
// 创建Express路由器实例，专门处理管理端系统管理相关的路由
const router = express.Router();
// 从中间件模块引入预定义的中间件堆栈和工厂函数
const { stacks, factories } = require('../../../middleware');
// 从控制器模块引入管理端系统管理控制器类
const { AdminSystemController } = require('../../../controllers');

// 创建管理端系统管理控制器实例，用于处理具体的系统管理业务逻辑
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
// 获取系统信息路由：需要系统读取权限，返回系统版本、运行时间、环境等基本信息
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
// 获取系统统计信息路由：需要系统读取权限，返回用户统计、请求统计等数据
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
// 获取系统日志路由：需要系统读取权限，支持按级别和时间范围查询系统日志
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
// 清除系统缓存路由：需要敏感操作权限，可以清除指定类型或全部缓存
router.post('/cache/clear', stacks.admin.sensitive, adminSystemController.clearSystemCache);

// 获取系统健康状态路由：需要系统读取权限，检查数据库、Redis等服务状态
router.get('/health', factories.createAdminPermissionStack(['system:read']), adminSystemController.getHealthStatus);
// 获取系统配置路由：需要系统读取权限，返回当前系统配置信息
router.get('/config', factories.createAdminPermissionStack(['system:read']), adminSystemController.getSystemConfig);
// 更新系统配置路由：需要敏感操作权限，允许修改系统配置参数
router.put('/config', stacks.admin.sensitive, adminSystemController.updateSystemConfig);
// 重启应用路由：需要超级管理员权限，重启整个应用服务（极危险操作）
router.post('/restart', stacks.admin.superAdmin, adminSystemController.restartApplication);
// 获取API统计信息路由：需要系统读取权限，返回API调用统计和性能数据
router.get('/api-stats', factories.createAdminPermissionStack(['system:read']), adminSystemController.getApiStatistics);
// 导出系统数据路由：需要超级管理员权限，导出系统数据用于备份或迁移
router.post('/export', stacks.admin.superAdmin, adminSystemController.exportSystemData);
// 获取性能指标路由：需要系统读取权限，返回CPU、内存、响应时间等性能指标
router.get('/performance', factories.createAdminPermissionStack(['system:read']), adminSystemController.getPerformanceMetrics);

// 导出路由器，供上级路由使用
module.exports = router;
