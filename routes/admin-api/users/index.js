const express = require('express');
const router = express.Router();
const { adminApiMiddleware } = require('../../../middleware/adminApi');

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
router.get('/', adminApiMiddleware.withPermissions(['user:read']), async function(req, res) {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    // 示例实现：获取用户列表
    // 这里应该从数据库查询，现在返回模拟数据
    const mockUsers = [
      {
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        nickname: '用户1',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        last_login: '2023-12-01T12:00:00Z'
      },
      {
        id: 2,
        username: 'user2',
        email: 'user2@example.com',
        nickname: '用户2',
        status: 'inactive',
        created_at: '2023-02-01T00:00:00Z',
        last_login: '2023-11-01T12:00:00Z'
      }
    ];
    
    // 应用筛选条件
    let filteredUsers = mockUsers;
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.includes(search) || user.email.includes(search)
      );
    }
    
    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    res.sendSuccess('获取用户列表成功', {
      data: {
        users: paginatedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limit)
        },
        admin: req.user ? { id: req.user.id, username: req.user.username } : null
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    });
  }
});

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
router.get('/:id', adminApiMiddleware.withPermissions(['user:read']), function(req, res) {
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
  adminApiMiddleware.sensitiveOperation('user-status-change', ['user:write']), 
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
router.delete('/:id', adminApiMiddleware.superAdmin, function(req, res) {
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

module.exports = router;
