# Express API 企业级后端框架

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/express-4.18.2-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)

一个功能完善、生产就绪的Express.js API框架，集成了现代化的开发工具和最佳实践。

## ✨ 核心特性

### 🚀 现代化架构
- **Express.js 4.18.2** - 高性能Node.js Web框架
- **MySQL 8.0 + Sequelize ORM** - 强大的关系型数据库支持
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
- **ESLint + Prettier** - 代码质量和格式化
- **Jest测试** - 完整的单元测试框架
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
│   ├── mysql/          # 数据库连接
│   ├── redis/          # Redis连接
│   ├── logger/         # 日志系统
│   ├── i18n/           # 国际化
│   └── util/           # 工具函数
├── env/                # 环境配置
├── tests/              # 测试文件
├── scripts/            # 脚本文件
├── docker-compose.yml  # Docker编排
├── Dockerfile         # Docker镜像
└── Makefile          # 项目管理命令
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **MySQL** >= 8.0
- **Redis** >= 6.0
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

# 编辑配置文件，设置数据库和Redis连接信息
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
- API文档: http://localhost:3000/api-docs
- 健康检查: http://localhost:3000/health

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
npm test            # 运行测试
npm run lint        # 代码检查
npm run format      # 代码格式化
npm run db:sync     # 同步数据库
```

### Make命令
```bash
make help           # 显示所有可用命令
make dev            # 启动开发环境
make prod-bg        # 后台启动生产环境
make test           # 运行测试
make lint-fix       # 修复代码问题
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

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
make test-coverage
```

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

## 🌍 国际化

支持多语言配置：
- 中文 (zh)
- 英文 (en)
- 动态语言切换
- 错误消息本地化

## 📈 性能优化

- **响应压缩**: gzip压缩减少传输大小
- **静态资源缓存**: 智能缓存策略
- **数据库连接池**: 高效的连接管理
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
- [ ] 更多数据库支持 (PostgreSQL, MongoDB)
- [ ] 实时通信 (WebSocket)
- [ ] 消息队列集成
- [ ] 监控仪表板
- [ ] 自动化部署流水线

---

**Made with ❤️ by [Your Team Name]**
