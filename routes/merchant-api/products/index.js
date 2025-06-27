// 引入Express框架，用于创建路由器
const express = require('express');
// 创建Express路由器实例，专门处理商户商品管理相关的路由
const router = express.Router();
// 从中间件模块引入预定义的中间件堆栈，用于认证和权限验证
const { stacks } = require('../../../middleware');
// 从控制器模块引入商户商品控制器类
const { MerchantProductController } = require('../../../controllers');

// 创建商户商品控制器实例，用于处理具体的商品管理业务逻辑
const merchantProductController = new MerchantProductController();

/**
 * @swagger
 * tags:
 *   name: Merchant Products
 *   description: 商户端商品管理接口
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 商品ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 商品名称
 *           example: "示例商品"
 *         description:
 *           type: string
 *           description: 商品描述
 *           example: "这是一个示例商品"
 *         price:
 *           type: number
 *           format: decimal
 *           description: 商品价格
 *           example: 99.99
 *         originalPrice:
 *           type: number
 *           format: decimal
 *           description: 原价
 *           example: 129.99
 *         stock:
 *           type: integer
 *           description: 库存数量
 *           example: 100
 *         status:
 *           type: integer
 *           description: 商品状态 (0:下架, 1:上架, 2:缺货)
 *           example: 1
 *         categoryId:
 *           type: integer
 *           description: 分类ID
 *           example: 10
 *         shopId:
 *           type: integer
 *           description: 店铺ID
 *           example: 1
 *         merchantId:
 *           type: integer
 *           description: 商户ID
 *           example: 100
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: 商品图片URL列表
 *           example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *           example: "2023-01-01T00:00:00Z"
 */

/**
 * @swagger
 * /api/merchant/products:
 *   get:
 *     summary: 获取商户商品列表
 *     description: 获取当前商户的所有商品信息
 *     tags: [Merchant Products]
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
 *         name: shopId
 *         schema:
 *           type: integer
 *         description: 店铺ID筛选
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: 分类ID筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2]
 *         description: 商品状态筛选
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 关键词搜索
 *     responses:
 *       200:
 *         description: 成功获取商品列表
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
 *                   example: "获取商品列表成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
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
 *                           example: 500
 */
// 获取商户商品列表路由：使用商品专用中间件栈，包含缓存
router.get('/', stacks.merchant.product, merchantProductController.getProducts);

/**
 * @swagger
 * /api/merchant/products/{productId}:
 *   get:
 *     summary: 获取商品详情
 *     description: 获取指定商品的详细信息
 *     tags: [Merchant Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 商品ID
 *     responses:
 *       200:
 *         description: 成功获取商品详情
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
 *                   example: "获取商品详情成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 */
// 获取商品详情路由：需要商户认证和缓存
router.get('/:productId', stacks.merchant.cached, merchantProductController.getProductById);

/**
 * @swagger
 * /api/merchant/products:
 *   post:
 *     summary: 创建新商品
 *     description: 为当前商户创建新的商品
 *     tags: [Merchant Products]
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
 *               - price
 *               - stock
 *               - shopId
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: 商品名称
 *                 example: "新商品"
 *               description:
 *                 type: string
 *                 description: 商品描述
 *                 example: "这是一个新商品"
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: 商品价格
 *                 example: 88.88
 *               originalPrice:
 *                 type: number
 *                 format: decimal
 *                 description: 原价
 *                 example: 108.88
 *               stock:
 *                 type: integer
 *                 description: 库存数量
 *                 example: 50
 *               shopId:
 *                 type: integer
 *                 description: 店铺ID
 *                 example: 1
 *               categoryId:
 *                 type: integer
 *                 description: 分类ID
 *                 example: 10
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 商品图片URL列表
 *                 example: ["https://example.com/new-image1.jpg"]
 *     responses:
 *       201:
 *         description: 商品创建成功
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
 *                   example: "商品创建成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 */
// 创建商品路由：使用商品专用中间件栈
router.post('/', stacks.merchant.product, merchantProductController.createProduct);

/**
 * @swagger
 * /api/merchant/products/{productId}:
 *   put:
 *     summary: 更新商品信息
 *     description: 更新指定商品的信息
 *     tags: [Merchant Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 商品ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 商品名称
 *               description:
 *                 type: string
 *                 description: 商品描述
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: 商品价格
 *               originalPrice:
 *                 type: number
 *                 format: decimal
 *                 description: 原价
 *               stock:
 *                 type: integer
 *                 description: 库存数量
 *               status:
 *                 type: integer
 *                 description: 商品状态
 *                 enum: [0, 1, 2]
 *               categoryId:
 *                 type: integer
 *                 description: 分类ID
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 商品图片URL列表
 *     responses:
 *       200:
 *         description: 商品更新成功
 */
// 更新商品路由：使用商品专用中间件栈
router.put('/:productId', stacks.merchant.product, merchantProductController.updateProduct);

/**
 * @swagger
 * /api/merchant/products/{productId}:
 *   delete:
 *     summary: 删除商品
 *     description: 删除指定的商品（软删除）
 *     tags: [Merchant Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 商品ID
 *     responses:
 *       200:
 *         description: 商品删除成功
 */
// 删除商品路由：需要敏感操作审计
router.delete('/:productId', stacks.merchant.sensitive, merchantProductController.deleteProduct);

/**
 * @swagger
 * /api/merchant/products/batch:
 *   put:
 *     summary: 批量更新商品状态
 *     description: 批量更新多个商品的状态
 *     tags: [Merchant Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *               - status
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 商品ID列表
 *                 example: [1, 2, 3, 4, 5]
 *               status:
 *                 type: integer
 *                 description: 目标状态
 *                 enum: [0, 1, 2]
 *                 example: 1
 *     responses:
 *       200:
 *         description: 批量更新成功
 */
// 批量更新商品状态路由：需要敏感操作审计
router.put('/batch', stacks.merchant.sensitive, merchantProductController.batchUpdateStatus);

// 导出路由器，供上级路由使用
module.exports = router;
