# Express API 企业级后端框架

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/express-4.18.2-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)

一个功能完善、生产就绪的Express.js API框架，集成了现代化的开发工具和最佳实践。

## ✨ 核心特性

### 🚀 现代化架构
- **Express.js 4.18.2** - 高性能Node.js Web框架
- **双数据库支持** - MySQL + Sequelize ORM (关系型数据) + MongoDB + Mongoose ODM (文档型数据)
- **Redis 7** - 高性能缓存和会话存储
- **JWT认证** - 安全的用户认证机制
- **Swagger UI** - 自动生成的API文档

### 🛡️ 安全与性能
- **Helmet** - 安全头部保护
- **CORS** - 跨域资源共享配置
- **限流保护** - API请求频率限制
- **数据验证** - 输入数据校验和清理
- **压缩中间件** - 响应数据压缩优化
- **集群模式** - 多进程负载均衡

### 🔧 开发体验
- **热重载** - 开发环境自动重启
- **Winston日志** - 结构化日志记录
- **国际化(i18n)** - 多语言支持
- **健康检查** - 应用状态监控

### 📦 容器化部署
- **Docker支持** - 完整的容器化方案
- **Docker Compose** - 一键启动完整环境
- **多阶段构建** - 优化的生产镜像
- **Nginx反向代理** - 负载均衡和SSL终止

## 🏗️ 项目结构

```
express-api/
├── app.js                 # 应用主入口
├── bin/www               # 服务器启动脚本
├── routes/               # 路由定义
│   ├── index.js         # 主路由
│   └── users/           # 用户相关路由
├── models/              # 数据模型
├── middleware/          # 中间件
│   ├── auth/           # 认证中间件
│   ├── cache/          # 缓存中间件
│   ├── rateLimit/      # 限流中间件
│   └── validator/      # 验证中间件
├── common/             # 公共模块
│   ├── mysql/          # MySQL数据库连接
│   ├── mango/          # MongoDB数据库连接
│   ├── redis/          # Redis连接
│   ├── logger/         # 日志系统
│   ├── i18n/           # 国际化
│   └── util/           # 工具函数
├── env/                # 环境配置
├── scripts/            # 脚本文件
├── docker-compose.yml  # Docker编排
├── Dockerfile         # Docker镜像
└── Makefile          # 项目管理命令
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **MySQL** >= 8.0 (关系型数据存储)
- **MongoDB** >= 4.4 (可选，文档型数据存储)
- **Redis** >= 6.0 (可选，缓存存储)
- **Docker** (可选，用于容器化部署)

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd express-api
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境配置文件
cp env/dev.env .env

# 编辑配置文件，设置MySQL、MongoDB和Redis连接信息
nano .env
```

4. **启动服务**
```bash
# 开发模式（热重载）
npm run dev

# 或使用Make命令
make dev
```

5. **访问应用**
- API服务: http://localhost:3000
- 通用API文档: http://localhost:3000/api-docs
- 用户端API文档: http://localhost:3000/api-docs/user
- 管理端API文档: http://localhost:3000/api-docs/admin
- 健康检查: http://localhost:3000/health
- MongoDB测试: http://localhost:3000/mongodb-test

### Docker快速启动

```bash
# 启动完整环境（包含MySQL和Redis）
docker-compose up -d

# 或使用Make命令
make prod-bg
```

## 📖 详细文档

- [📋 安装与配置指南](docs/INSTALLATION.md)
- [🔌 API使用文档](docs/API.md)
- [🚀 部署指南](docs/DEPLOYMENT.md)
- [👨‍💻 开发文档](docs/DEVELOPMENT.md)

## 🛠️ 可用命令

### NPM脚本
```bash
npm run dev          # 开发模式启动
npm run start:prod   # 生产模式启动
npm run db:sync     # 同步数据库
```

### Make命令
```bash
make help           # 显示所有可用命令
make dev            # 启动开发环境
make prod-bg        # 后台启动生产环境
make clean          # 清理临时文件
```

## 🔧 核心配置

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `dev` |
| `PORT` | 服务端口 | `3000` |
| `DB_HOST` | 数据库主机 | `localhost` |
| `DB_PORT` | 数据库端口 | `3306` |
| `DB_NAME` | 数据库名称 | `testSxx` |
| `REDIS_HOST` | Redis主机 | `localhost` |
| `REDIS_PORT` | Redis端口 | `6379` |
| `JWT_SECRET` | JWT密钥 | - |

### 数据库配置

支持MySQL连接池配置，包括：
- 最大/最小连接数
- 连接超时设置
- 重试机制
- 连接生命周期管理

### 缓存配置

Redis缓存支持多级TTL配置：
- 短期缓存：5分钟
- 中期缓存：1小时
- 长期缓存：1天

## 📊 监控与日志

### 日志系统
- **开发环境**: Morgan控制台日志
- **生产环境**: Winston结构化日志
- **日志轮转**: 按日期自动轮转
- **日志级别**: error, warn, info, debug

### 健康检查
- 端点: `/health`
- 检查项: 数据库连接、Redis连接、内存使用
- Docker健康检查集成

### 性能监控
- 请求响应时间记录
- API调用统计
- 错误率监控
- 资源使用情况

## 🔒 安全特性

- **Helmet**: 设置安全HTTP头部
- **CORS**: 跨域请求控制
- **限流**: API请求频率限制
- **输入验证**: 数据校验和清理
- **JWT认证**: 安全的用户认证
- **密码加密**: bcrypt哈希加密

## 🔗 API接口分类

本项目支持三种类型的API接口，满足不同场景的需求：

### 用户端接口 (`/api/user/*`)
- **目标用户**: 普通终端用户
- **认证方式**: JWT令牌认证（部分接口支持可选认证）
- **限流策略**: 相对宽松（每15分钟1000次请求）
- **功能范围**: 用户认证、个人资料管理、基础业务功能
- **API文档**: http://localhost:3000/api-docs/user

**示例接口**:
```
POST /api/user/auth/login     # 用户登录
GET  /api/user/profile        # 获取个人资料
PUT  /api/user/profile        # 更新个人资料
```

### 管理端接口 (`/api/admin/*`)
- **目标用户**: 系统管理员
- **认证方式**: 管理员JWT令牌认证（严格权限验证）
- **限流策略**: 相对严格（每15分钟500次请求）
- **功能范围**: 用户管理、系统管理、数据统计、敏感操作
- **API文档**: http://localhost:3000/api-docs/admin

**示例接口**:
```
GET    /api/admin/users           # 获取用户列表
PUT    /api/admin/users/:id/status # 更新用户状态
GET    /api/admin/system/info     # 获取系统信息
POST   /api/admin/system/cache/clear # 清除系统缓存
```

### 通用接口 (`/*`)
- **目标用户**: 所有用户
- **认证方式**: 无需认证或基础认证
- **功能范围**: 健康检查、基础信息、公共功能
- **API文档**: http://localhost:3000/api-docs

**示例接口**:
```
GET /health           # 健康检查
GET /mongodb-test     # MongoDB连接测试
GET /cache-demo       # 缓存演示
```

## 🌍 国际化

支持多语言配置：
- 中文 (zh)
- 英文 (en)
- 动态语言切换
- 错误消息本地化

## 🗄️ 双数据库架构

本项目支持MySQL和MongoDB双数据库并存，您可以根据不同的业务需求选择合适的数据库：

### MySQL (关系型数据库)
- **适用场景**: 结构化数据、事务处理、复杂关联查询
- **ORM**: Sequelize
- **连接配置**: `env/dev.env` 中的 `DB_*` 配置项
- **使用方式**: 通过 `res.sequelize` 访问

```javascript
// 在路由中使用MySQL
router.get('/users', async (req, res) => {
  const users = await res.sequelize.models.User.findAll();
  res.sendSuccess('获取用户列表成功', { data: users });
});
```

### MongoDB (文档型数据库)
- **适用场景**: 非结构化数据、灵活模式、高性能读写
- **ODM**: Mongoose
- **连接配置**: `env/dev.env` 中的 `MONGO_*` 配置项
- **使用方式**: 通过 `res.mongodb` 访问

```javascript
// 在路由中使用MongoDB
router.post('/logs', async (req, res) => {
  const { mongoose } = res.mongodb;
  const result = await mongoose.connection.db
    .collection('logs')
    .insertOne(req.body);
  res.sendSuccess('日志保存成功', { data: result });
});
```

### 环境配置示例
```bash
# MySQL配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=123456
DB_NAME=testSxx

# MongoDB配置
MONGO_URI=mongodb://localhost:27017/testSxx
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB_NAME=testSxx
```

### 健康检查
系统会自动检查两个数据库的连接状态，访问 `/health` 端点查看详细状态。

## 📈 性能优化

- **响应压缩**: gzip压缩减少传输大小
- **静态资源缓存**: 智能缓存策略
- **数据库连接池**: MySQL和MongoDB的高效连接管理
- **Redis缓存**: 减少数据库查询
- **集群模式**: 多进程负载均衡

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到问题或有疑问：

1. 查看 [文档](docs/)
2. 搜索 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)
4. 联系技术支持: support@example.com

## 🎯 路线图

- [ ] GraphQL支持
- [ ] 微服务架构支持
- [x] 双数据库支持 (MySQL + MongoDB)
- [ ] 更多数据库支持 (PostgreSQL)
- [ ] 实时通信 (WebSocket)
- [ ] 消息队列集成
- [ ] 监控仪表板
- [ ] 自动化部署流水线

---

**Made with ❤️ by [Your Team Name]**
