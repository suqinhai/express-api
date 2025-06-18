# Express API 框架

一个基于Express.js的RESTful API框架，具有丰富的功能和良好的结构化设计。

## 项目概述

本项目是一个完整的后端API框架，基于Express.js构建，提供了一系列开箱即用的功能、中间件和最佳实践，帮助开发者快速构建高性能、安全、可维护的RESTful API服务。

## 主要功能

- **RESTful API设计**：规范的API结构和响应格式
- **用户认证与授权**：支持JWT认证和基于角色的权限控制
- **数据库集成**：内置Sequelize ORM和MySQL支持
- **缓存支持**：Redis缓存集成和优化
- **日志记录**：高级日志系统，支持请求日志和集群日志
- **国际化**：多语言本地化支持
- **API文档**：自动生成Swagger文档
- **安全加固**：各种安全中间件和最佳实践
- **请求限流**：防止API滥用的速率限制
- **健康检查**：系统各组件的健康监控
- **响应压缩**：自动压缩HTTP响应以提高性能
- **资源缓存**：优化静态资源的客户端缓存

## 安装与配置

### 环境要求

- Node.js v14+
- MySQL 5.7+
- Redis (可选)

### 安装步骤

1. 克隆仓库
   ```
   git clone <repository-url>
   cd express-api
   ```

2. 安装依赖
   ```
   npm install
   ```

3. 配置环境变量
   ```
   cp env/dev.env env/.env
   ```

4. 修改环境变量配置
   编辑 `env/.env` 文件，调整数据库连接、Redis配置等

5. 初始化数据库
   ```
   npm run sync-db
   ```

6. 启动开发服务器
   ```
   npm run dev
   ```

## 开发指南

### 目录结构

```
express-api/
├── bin/              # 服务启动脚本
├── common/           # 通用功能和工具
│   ├── logger/       # 日志功能
│   ├── mysql/        # 数据库连接
│   ├── redis/        # Redis缓存
│   └── ...
├── middleware/       # 中间件
│   ├── auth/         # 认证中间件
│   ├── rateLimit/    # 请求限流
│   └── ...
├── models/           # 数据模型
├── routes/           # API路由
├── views/            # 视图模板
└── app.js            # 主应用
```

### 创建新API

1. 在 `routes` 目录下创建新的路由文件
2. 在 `models` 目录下创建相应的数据模型
3. 使用Swagger注释文档化API
4. 在 `routes/index.js` 中注册新路由

## 新增功能详细说明

### 1. 集群日志记录

项目集成了高级集群日志记录功能，能够区分主进程和工作进程的日志，适用于在PM2等进程管理器下运行的多实例部署。

#### 使用方法

```javascript
const { logger } = require('./common/logger');
const clusterLogger = require('./common/logger/clusterLogger');

// 常规日志
logger.info('常规信息日志');
logger.error('错误日志', new Error('发生错误'));

// 集群特定日志
clusterLogger.clusterEvent('start', '工作进程已启动', { workerId: 1 });
```

#### 配置选项

日志文件存储在 `logs` 目录，按日期轮转，并分为不同级别：
- 常规日志：`YYYY-MM-DD-app.log`
- 错误日志：`YYYY-MM-DD-error.log`
- 集群日志：`YYYY-MM-DD-cluster.log`
- 集群错误：`YYYY-MM-DD-cluster-error.log`

### 2. 响应压缩

项目使用compression中间件自动压缩HTTP响应，减小传输数据大小，提高API响应速度。

#### 配置

默认配置已在`app.js`中设置，包括：
- 压缩级别：6（1-9范围内，越高压缩率越好但CPU占用更多）
- 压缩阈值：1KB以上的响应会被压缩
- 自定义过滤：支持通过请求头`x-no-compression`跳过压缩

#### 手动禁用

客户端可发送自定义头部禁用特定请求的压缩：
```
GET /api/large-data HTTP/1.1
Host: example.com
x-no-compression: true
```

### 3. 静态资源缓存

针对不同类型的静态资源实现了优化的缓存策略，通过设置适当的`Cache-Control`头部控制客户端缓存行为。

#### 缓存策略

- HTML文件：5分钟 (`max-age=300`)
- CSS/JS文件：1天 (`max-age=86400`)
- 图片文件：30天 (`max-age=2592000`)
- 字体文件：1年 (`max-age=31536000`)
- 其他资源：1小时 (`max-age=3600`)

#### 静态资源更新

要强制刷新已缓存的静态资源，可以：
1. 在文件名中添加版本号：`style.v2.css`
2. 使用查询参数：`style.css?v=2`
3. 在生产环境中使用内容哈希文件名

### 4. 健康检查模块

实现了全面的健康检查系统，监控API服务的各个组件状态，包括数据库连接、缓存服务和系统资源。

#### 接口使用

```
GET /health
```

可选查询参数`type`指定检查类型：
- `full`: 全面检查（默认）
- `db`: 仅检查数据库
- `cache`: 仅检查缓存服务
- `system`: 仅检查系统资源

#### 响应示例

```json
{
  "status": "ok",
  "timestamp": "2023-04-01T12:34:56.789Z",
  "uptime": 3600.5,
  "components": {
    "database": {
      "status": "ok",
      "responseTime": "15ms",
      "details": {
        "dialect": "mysql",
        "connection": "active"
      }
    },
    "cache": {
      "status": "ok",
      "responseTime": "5ms",
      "details": {
        "connection": "active"
      }
    },
    "system": {
      "status": "ok",
      "details": {
        "memory": {
          "total": "16384 MB",
          "free": "8192 MB",
          "usage": "50%",
          "warning": false
        },
        "cpu": {
          "cores": 8,
          "load": [1.2, 1.5, 1.7],
          "warning": false
        }
      }
    }
  },
  "version": "1.0.0"
}
```

#### 状态码说明

- `ok`: 组件运行良好
- `warning`: 组件运行，但有潜在问题
- `degraded`: 部分组件出现问题
- `error`: 组件无法正常工作

### 5. 数据库连接池优化

项目使用了优化的数据库连接池配置，通过精细调整连接池参数提高数据库操作性能和稳定性。

#### 配置参数

所有连接池参数都可通过环境变量进行配置：

```
# 数据库连接池配置
DB_POOL_MAX=20         # 最大连接数
DB_POOL_MIN=5          # 最小连接数
DB_POOL_ACQUIRE=30000  # 获取连接超时时间(毫秒)
DB_POOL_IDLE=10000     # 空闲连接超时时间(毫秒)
DB_POOL_EVICT=1000     # 空闲检查间隔时间(毫秒)
DB_POOL_MAX_USES=7500  # 单个连接最大使用次数，0表示无限制
DB_CONNECT_TIMEOUT=60000 # 连接超时时间(毫秒)
DB_RETRY_MAX=3         # 最大重试次数
```

#### 高级特性

连接池实现了以下高级特性：

- **连接验证**：定期验证连接是否有效，自动移除无效连接
- **连接重用限制**：限制单个连接的最大使用次数，防止连接老化
- **自动重试**：针对特定错误（如死锁、超时）自动重试操作
- **事务隔离级别**：默认使用READ_COMMITTED隔离级别，平衡性能与一致性
- **性能日志**：开发环境下记录SQL查询时间，便于性能调优

#### 生产环境建议

对于高负载生产环境，建议根据服务器资源和并发请求量调整以下参数：

- 增加`DB_POOL_MAX`以支持更高并发（但不要超过数据库服务器连接限制的70%）
- 适当增加`DB_POOL_MIN`预热连接池，减少峰值请求的连接创建开销
- 根据业务复杂度调整`DB_POOL_IDLE`，长耗时查询应设置更长的空闲超时
- 对于长时间运行的服务，启用`DB_POOL_MAX_USES`防止连接泄漏和资源耗尽

## 生产环境部署

### PM2部署

使用PM2进行集群模式部署：

```
npm install pm2 -g
pm2 start ecosystem.config.js
```

### Docker部署

使用项目根目录的Dockerfile构建和运行：

```
docker build -t express-api .
docker run -p 3001:3001 express-api
```

## 问题排查

常见问题和解决方法请参考 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 性能优化

项目持续进行性能和架构优化，详细的优化记录和计划请参考 [OPTIMIZATIONS.md](OPTIMIZATIONS.md)。

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开Pull Request

## 许可证

本项目采用MIT许可证 