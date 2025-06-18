/**
 * 用户缓存路由
 * 展示如何使用模型缓存中间件
 */

const express = require('express');
const router = express.Router();
const { cache } = require('../../middleware');
const EnhancedUser = require('../../models/users/enhancedUser');
const { logger } = require('../../common/logger');

/**
 * @swagger
 * /users/cached/{id}:
 *   get:
 *     summary: 获取用户（带缓存）
 *     description: 通过ID获取用户信息，使用缓存减少数据库查询
 *     tags: [Users, Cache]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *       - in: query
 *         name: nocache
 *         schema:
 *           type: boolean
 *         description: 设置为true跳过缓存（默认false）
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async function(req, res) {
  try {
    const id = parseInt(req.params.id);
    
    // 记录查询开始时间
    const startTime = Date.now();
    
    // 如果请求参数包含nocache=true，则绕过缓存
    let user;
    if (req.query.nocache === 'true') {
      user = await EnhancedUser.findByPkNoCache(id);
      res.set('X-Cache', 'BYPASS');
    } else {
      user = await EnhancedUser.findByPk(id);
    }
    
    // 计算查询耗时
    const duration = Date.now() - startTime;
    
    if (!user) {
      return res.sendBadRequest('用户不存在');
    }
    
    // 不返回密码字段
    const { password, ...safeUser } = user.toJSON();
    
    // 添加缓存和性能信息
    safeUser.meta = {
      cached: res.get('X-Cache') === 'HIT',
      queryTime: `${duration}ms`
    };
    
    res.sendSuccess('获取用户成功', { data: safeUser });
  } catch (error) {
    logger.error('获取用户失败', { category: 'USER', error });
    res.sendBadRequest('获取用户失败');
  }
});

/**
 * @swagger
 * /users/cached/username/{username}:
 *   get:
 *     summary: 通过用户名获取用户（带缓存）
 *     description: 根据用户名查找用户信息，使用缓存减少数据库查询
 *     tags: [Users, Cache]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户名
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/username/:username', async function(req, res) {
  try {
    const { username } = req.params;
    
    // 记录查询开始时间
    const startTime = Date.now();
    
    // 使用缓存的方法查询
    const user = await EnhancedUser.findByUsername(username);
    
    // 计算查询耗时
    const duration = Date.now() - startTime;
    
    if (!user) {
      return res.sendBadRequest('用户不存在');
    }
    
    // 不返回密码字段
    const { password, ...safeUser } = user.toJSON();
    
    // 添加缓存和性能信息
    safeUser.meta = {
      cached: res.get('X-Cache') === 'HIT',
      queryTime: `${duration}ms`
    };
    
    res.sendSuccess('获取用户成功', { data: safeUser });
  } catch (error) {
    logger.error('获取用户失败', { category: 'USER', error });
    res.sendBadRequest('获取用户失败');
  }
});

/**
 * @swagger
 * /users/cached/active:
 *   get:
 *     summary: 获取活跃用户列表（带缓存）
 *     description: 获取最近活跃的用户列表，使用缓存减少数据库查询
 *     tags: [Users, Cache]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 返回结果数量限制
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/active', async function(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // 记录查询开始时间
    const startTime = Date.now();
    
    // 使用缓存的方法查询
    const users = await EnhancedUser.getActiveUsers(limit);
    
    // 计算查询耗时
    const duration = Date.now() - startTime;
    
    // 不返回密码字段
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user.toJSON();
      return safeUser;
    });
    
    // 添加元数据
    const result = {
      users: safeUsers,
      meta: {
        count: safeUsers.length,
        cached: res.get('X-Cache') === 'HIT',
        queryTime: `${duration}ms`
      }
    };
    
    res.sendSuccess('获取活跃用户成功', { data: result });
  } catch (error) {
    logger.error('获取活跃用户失败', { category: 'USER', error });
    res.sendBadRequest('获取活跃用户失败');
  }
});

/**
 * @swagger
 * /users/cached/clear/{id}:
 *   post:
 *     summary: 清除用户缓存
 *     description: 清除特定用户ID的缓存数据
 *     tags: [Users, Cache]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/clear/:id', async function(req, res) {
  try {
    const id = parseInt(req.params.id);
    
    // 清除特定用户的缓存
    await EnhancedUser.clearCache(id);
    
    res.sendSuccess('用户缓存已清除', {
      data: {
        userId: id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('清除用户缓存失败', { category: 'CACHE', error });
    res.sendBadRequest('清除用户缓存失败');
  }
});

/**
 * @swagger
 * /users/cached/clear-all:
 *   post:
 *     summary: 清除所有用户缓存
 *     description: 清除所有用户相关的缓存数据
 *     tags: [Users, Cache]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/clear-all', async function(req, res) {
  try {
    // 清除所有用户缓存
    const clearedKeys = await EnhancedUser.clearCache();
    
    res.sendSuccess('所有用户缓存已清除', {
      data: {
        clearedCount: clearedKeys.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('清除所有用户缓存失败', { category: 'CACHE', error });
    res.sendBadRequest('清除所有用户缓存失败');
  }
});

module.exports = router; 