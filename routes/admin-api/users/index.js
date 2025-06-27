// 引入Express框架，用于创建路由器
const express = require('express');
// 创建Express路由器实例，专门处理管理端用户管理相关的路由
const router = express.Router();
// 从中间件模块引入预定义的中间件堆栈和工厂函数
const { stacks, factories } = require('../../../middleware');
// 从控制器模块引入管理端用户管理控制器类
const { AdminUserController } = require('../../../controllers');

// 创建管理端用户管理控制器实例，用于处理具体的用户管理业务逻辑
const adminUserController = new AdminUserController();

/**
 * @swagger
 * tags:
 *   name: Admin Users
 *   description: 管理端用户管理接口
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminUserList:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "获取用户列表成功"
 *         data:
 *           type: object
 *           properties:
 *             users:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: 获取用户列表
 *     description: 管理员获取系统中所有用户的列表，支持分页和筛选
 *     tags: [Admin Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, locked, pending]
 *         description: 用户状态筛选
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（用户名、邮箱）
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUserList'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 获取用户列表路由：需要用户读取权限，支持分页、搜索和过滤
router.get('/', factories.createAdminPermissionStack(['user:read']), adminUserController.getUserList);

// 获取用户详情路由：需要用户读取权限，返回指定用户的完整信息
router.get('/:id', factories.createAdminPermissionStack(['user:read']), adminUserController.getUserDetail);

// 创建用户路由：需要用户创建权限，管理员可以创建新用户账户
router.post('/', factories.createAdminPermissionStack(['user:create']), adminUserController.createUser);

// 更新用户信息路由：需要用户写入权限，允许修改用户基本信息
router.put('/:id', factories.createAdminPermissionStack(['user:write']), adminUserController.updateUser);

// 更新用户状态路由：需要敏感操作权限，可以激活、禁用或锁定用户
router.patch('/:id/status', stacks.admin.sensitive, adminUserController.updateUserStatus);

// 重置用户密码路由：需要敏感操作权限，管理员可以重置用户密码
router.post('/:id/reset-password', stacks.admin.sensitive, adminUserController.resetUserPassword);

// 删除用户路由：需要敏感操作权限，永久删除用户账户（谨慎操作）
router.delete('/:id', stacks.admin.sensitive, adminUserController.deleteUser);

// 批量更新用户状态路由：需要用户写入权限，可以批量操作多个用户状态
router.patch('/batch/status', factories.createAdminPermissionStack(['user:write']), adminUserController.batchUpdateUserStatus);

// 获取用户统计信息路由：需要用户读取权限，返回用户相关的统计数据
router.get('/statistics', factories.createAdminPermissionStack(['user:read']), adminUserController.getUserStatistics);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: 获取用户详情
 *     description: 管理员获取指定用户的详细信息
 *     tags: [Admin Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户详情
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
 *                   example: "获取用户详情成功"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', factories.createAdminPermissionStack(['user:read']), function(req, res) {
  // TODO: 实现获取用户详情逻辑
  const { id } = req.params;
  
  res.sendSuccess('获取用户详情成功', {
    data: {
      message: '此接口待实现',
      type: 'admin-user-detail',
      endpoint: `/api/admin/users/${id}`,
      admin: req.user ? { id: req.user.id, username: req.user.username } : null,
      targetUserId: id
    }
  });
});

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: 更新用户状态
 *     description: 管理员更新指定用户的状态（激活、禁用、锁定等）
 *     tags: [Admin Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
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
 *                 enum: [active, inactive, locked, pending]
 *                 description: 新的用户状态
 *               reason:
 *                 type: string
 *                 description: 状态变更原因
 *                 example: "违反用户协议"
 *     responses:
 *       200:
 *         description: 状态更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/status',
  stacks.admin.sensitive,
  function(req, res) {
    // TODO: 实现更新用户状态逻辑
    const { id } = req.params;
    const { status, reason } = req.body;
    
    res.sendSuccess('用户状态更新成功', {
      data: {
        message: '此接口待实现',
        type: 'admin-user-status-update',
        endpoint: `/api/admin/users/${id}/status`,
        admin: req.user ? { id: req.user.id, username: req.user.username } : null,
        targetUserId: id,
        newStatus: status,
        reason: reason
      }
    });
  }
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     description: 管理员删除指定用户（敏感操作，需要超级管理员权限）
 *     tags: [Admin Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 用户删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: 权限不足，需要超级管理员权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', stacks.admin.superAdmin, function(req, res) {
  // TODO: 实现删除用户逻辑
  const { id } = req.params;
  
  res.sendSuccess('用户删除成功', {
    data: {
      message: '此接口待实现',
      type: 'admin-user-delete',
      endpoint: `/api/admin/users/${id}`,
      admin: req.user ? { id: req.user.id, username: req.user.username } : null,
      deletedUserId: id
    }
  });
});

// 导出路由器，供上级路由使用
module.exports = router;
