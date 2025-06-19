# 插件化支付系统 API 文档

## 概述

本系统采用插件化架构设计，支持动态加载和管理多种支付渠道。目前已集成90+支付渠道，包括UsdtPay、FastPay、TopPay等主流支付服务商。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   支付API接口   │    │   管理API接口   │    │   回调处理接口  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   支付核心引擎  │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   插件管理器    │    │   订单管理器    │    │   配置管理器    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   数据访问层    │
                    └─────────────────┘
```

## 快速开始

### 1. 初始化数据库

```bash
npm run payment:sync
```

### 2. 启动服务

```bash
npm run start
```

### 3. 访问API文档

打开浏览器访问：http://localhost:3000/api-docs

## 核心API接口

### 支付接口

#### 创建支付订单
```http
POST /api/payment/create
Content-Type: application/json

{
  "merchant_order_no": "ORDER_20231201_001",
  "amount": 100.50,
  "currency": "USD",
  "subject": "商品购买",
  "body": "购买商品描述",
  "channel_code": "UsdtPay",
  "payment_method": "usdt_trc20",
  "notify_url": "https://your-domain.com/notify",
  "return_url": "https://your-domain.com/return",
  "user_id": 12345,
  "extra_params": {
    "custom_field": "custom_value"
  }
}
```

响应：
```json
{
  "success": true,
  "message": "支付订单创建成功",
  "data": {
    "order_id": 1001,
    "order_no": "PAY1701234567890ABC",
    "payment_url": "https://pay.usdtpay.com/pay/xxx",
    "qr_code": "data:image/png;base64,xxx",
    "wallet_address": "TXXXxxxXXXxxxXXX",
    "amount_usdt": "100.50",
    "protocol": "TRC20",
    "expires_at": "2023-12-01T15:30:00Z"
  }
}
```

#### 查询订单状态
```http
GET /api/payment/query/{orderNo}
```

#### 获取可用支付渠道
```http
GET /api/payment/channels?currency=USD&amount=100
```

#### 申请退款
```http
POST /api/payment/refund
Content-Type: application/json

{
  "order_no": "PAY1701234567890ABC",
  "refund_amount": 50.00,
  "reason": "用户申请退款"
}
```

### 管理接口

#### 渠道管理
```http
# 获取渠道列表
GET /api/payment/admin/channels

# 创建渠道
POST /api/payment/admin/channels

# 更新渠道
PUT /api/payment/admin/channels/{channelId}

# 删除渠道
DELETE /api/payment/admin/channels/{channelId}
```

#### 配置管理
```http
# 获取渠道配置
GET /api/payment/admin/channels/{channelId}/configs

# 设置渠道配置
POST /api/payment/admin/channels/{channelId}/configs
```

## 支付回调处理

### 回调URL格式
```
POST /api/payment/callback/{channelCode}
```

### 回调数据示例（UsdtPay）
```json
{
  "order_no": "PAY1701234567890ABC",
  "trade_no": "TXN_USDT_20231201_001",
  "status": "success",
  "amount": "100.50",
  "currency": "USD",
  "paid_at": "2023-12-01T14:30:00Z",
  "sign": "abc123def456..."
}
```

### 回调响应
- 成功：返回 "SUCCESS"
- 失败：返回 "FAIL"

## 插件开发指南

### 1. 创建插件类

```javascript
const BasePaymentPlugin = require('./BasePaymentPlugin');

class YourPaymentPlugin extends BasePaymentPlugin {
  constructor() {
    super();
    this.pluginName = 'YourPaymentPlugin';
    this.pluginVersion = '1.0.0';
    this.supportedMethods = ['method1', 'method2'];
    this.supportedCurrencies = ['USD', 'CNY'];
  }

  // 实现必要的方法
  async createOrder(order, channel) {
    // 创建支付订单逻辑
  }

  async handleCallback(callbackData, channel) {
    // 处理支付回调逻辑
  }

  async verifyCallback(callbackData, channel) {
    // 验证回调签名逻辑
  }

  async queryOrder(order, channel) {
    // 查询订单状态逻辑
  }

  async refund(order, refundAmount, reason, channel) {
    // 退款处理逻辑
  }
}

module.exports = YourPaymentPlugin;
```

### 2. 配置插件信息

```javascript
getConfigSchema() {
  return {
    api_key: {
      type: 'string',
      required: true,
      encrypted: true,
      description: 'API密钥'
    },
    secret_key: {
      type: 'string',
      required: true,
      encrypted: true,
      description: '签名密钥'
    },
    gateway_url: {
      type: 'string',
      required: true,
      encrypted: false,
      description: '网关地址'
    }
  };
}
```

### 3. 注册插件

将插件文件放置在 `plugins/payment/` 目录下，系统会自动扫描并注册。

## 数据库表结构

### 核心表

- `payment_plugins` - 插件注册表
- `payment_channels` - 支付渠道表
- `payment_configs` - 渠道配置表
- `payment_orders` - 支付订单表
- `payment_transactions` - 交易记录表
- `payment_callbacks` - 回调日志表

### 关系图

```
payment_plugins (1) ──── (N) payment_channels
                                    │
                                    │ (1)
                                    │
                                    ▼ (N)
payment_configs                payment_orders
                                    │
                                    │ (1)
                                    │
                                    ▼ (N)
                              payment_transactions
                                    │
                                    │ (1)
                                    │
                                    ▼ (N)
                              payment_callbacks
```

## 配置说明

### 环境变量

```bash
# 配置加密密钥（生产环境必须修改）
CONFIG_ENCRYPTION_KEY=your-encryption-key-here

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password
DB_NAME=payment_db
```

### 渠道配置示例

```json
{
  "merchant_id": "YOUR_MERCHANT_ID",
  "api_key": "YOUR_API_KEY",
  "secret_key": "YOUR_SECRET_KEY",
  "gateway_url": "https://api.payment-provider.com",
  "callback_url": "https://your-domain.com/api/payment/callback/ChannelCode",
  "timeout": 30
}
```

## 安全注意事项

1. **配置加密**：敏感配置（如API密钥）会自动加密存储
2. **签名验证**：所有回调都会进行签名验证
3. **IP白名单**：建议配置支付服务商的回调IP白名单
4. **HTTPS**：生产环境必须使用HTTPS
5. **密钥管理**：定期更换API密钥和签名密钥

## 监控和日志

### 日志分类

- `PAYMENT_ENGINE` - 支付引擎日志
- `PLUGIN_MANAGER` - 插件管理日志
- `ORDER_MANAGER` - 订单管理日志
- `CONFIG_MANAGER` - 配置管理日志
- `PAYMENT_PLUGIN` - 插件执行日志

### 监控指标

- 订单创建成功率
- 支付成功率
- 回调处理成功率
- 插件响应时间
- 系统错误率

## 故障排除

### 常见问题

1. **插件加载失败**
   - 检查插件文件路径
   - 验证插件接口实现
   - 查看插件错误日志

2. **订单创建失败**
   - 检查渠道配置
   - 验证参数格式
   - 确认渠道状态

3. **回调处理失败**
   - 验证回调URL配置
   - 检查签名验证逻辑
   - 确认网络连通性

### 调试模式

```bash
# 启用调试日志
NODE_ENV=dev npm start
```

## 性能优化

1. **缓存策略**：配置信息会自动缓存
2. **连接池**：数据库连接池优化
3. **异步处理**：回调和查询采用异步处理
4. **批量操作**：支持批量订单处理

## 版本更新

### v1.0.0
- 初始版本发布
- 支持插件化架构
- 集成UsdtPay示例插件
- 完整的API接口
- 管理后台功能

## 技术支持

如有问题，请查看：
1. API文档：http://localhost:3000/api-docs
2. 系统日志：logs/ 目录
3. 测试用例：tests/payment.test.js
