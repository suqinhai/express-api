// 引入Express框架，用于创建路由器
const express = require('express');
// 创建Express路由器实例，专门处理商户店铺管理相关的路由
const router = express.Router();
// 从中间件模块引入预定义的中间件堆栈，用于认证和权限验证
const { stacks } = require('../../../middleware');
// 从控制器模块引入商户店铺控制器类
const { MerchantShopController } = require('../../../controllers');

// 创建商户店铺控制器实例，用于处理具体的店铺管理业务逻辑
const merchantShopController = new MerchantShopController();

/**
 * @swagger
 * tags:
 *   name: Merchant Shop
 *   description: 商户端店铺管理接口
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Shop:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 店铺ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 店铺名称
 *           example: "示例店铺"
 *         description:
 *           type: string
 *           description: 店铺描述
 *           example: "这是一个示例店铺"
 *         status:
 *           type: integer
 *           description: 店铺状态 (0:禁用, 1:启用)
 *           example: 1
 *         merchantId:
 *           type: integer
 *           description: 商户ID
 *           example: 100
 *         address:
 *           type: string
 *           description: 店铺地址
 *           example: "北京市朝阳区示例街道123号"
 *         phone:
 *           type: string
 *           description: 联系电话
 *           example: "13800138000"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *           example: "2023-01-01T00:00:00Z"
 */

/**
 * @swagger
 * /api/merchant/shop:
 *   get:
 *     summary: 获取商户店铺列表
 *     description: 获取当前商户的所有店铺信息
 *     tags: [Merchant Shop]
 *     security:
 *       - BearerAuth: []
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
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: 店铺状态筛选
 *     responses:
 *       200:
 *         description: 成功获取店铺列表
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
 *                   example: "获取店铺列表成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shops:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Shop'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 100
 */
// 获取商户店铺列表路由：需要商户认证，返回当前商户的所有店铺
router.get('/', stacks.merchant.cached, merchantShopController.getShops);

/**
 * @swagger
 * /api/merchant/shop/{shopId}:
 *   get:
 *     summary: 获取店铺详情
 *     description: 获取指定店铺的详细信息
 *     tags: [Merchant Shop]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店铺ID
 *     responses:
 *       200:
 *         description: 成功获取店铺详情
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
 *                   example: "获取店铺详情成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shop:
 *                       $ref: '#/components/schemas/Shop'
 */
// 获取店铺详情路由：需要店铺访问权限验证
router.get('/:shopId', stacks.merchant.shopAccess, merchantShopController.getShopById);

/**
 * @swagger
 * /api/merchant/shop:
 *   post:
 *     summary: 创建新店铺
 *     description: 为当前商户创建新的店铺
 *     tags: [Merchant Shop]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: 店铺名称
 *                 example: "新店铺"
 *               description:
 *                 type: string
 *                 description: 店铺描述
 *                 example: "这是一个新店铺"
 *               address:
 *                 type: string
 *                 description: 店铺地址
 *                 example: "北京市朝阳区新街道456号"
 *               phone:
 *                 type: string
 *                 description: 联系电话
 *                 example: "13900139000"
 *     responses:
 *       201:
 *         description: 店铺创建成功
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
 *                   example: "店铺创建成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shop:
 *                       $ref: '#/components/schemas/Shop'
 */
// 创建店铺路由：需要商户认证，创建新的店铺
router.post('/', stacks.merchant.authenticated, merchantShopController.createShop);

/**
 * @swagger
 * /api/merchant/shop/{shopId}:
 *   put:
 *     summary: 更新店铺信息
 *     description: 更新指定店铺的信息
 *     tags: [Merchant Shop]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店铺ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 店铺名称
 *               description:
 *                 type: string
 *                 description: 店铺描述
 *               address:
 *                 type: string
 *                 description: 店铺地址
 *               phone:
 *                 type: string
 *                 description: 联系电话
 *               status:
 *                 type: integer
 *                 description: 店铺状态
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: 店铺更新成功
 */
// 更新店铺路由：需要店铺访问权限验证
router.put('/:shopId', stacks.merchant.shopAccess, merchantShopController.updateShop);

/**
 * @swagger
 * /api/merchant/shop/{shopId}:
 *   delete:
 *     summary: 删除店铺
 *     description: 删除指定的店铺（软删除）
 *     tags: [Merchant Shop]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店铺ID
 *     responses:
 *       200:
 *         description: 店铺删除成功
 */
// 删除店铺路由：需要店铺访问权限验证和敏感操作审计
router.delete('/:shopId', stacks.merchant.sensitive, merchantShopController.deleteShop);

// 导出路由器，供上级路由使用
module.exports = router;
