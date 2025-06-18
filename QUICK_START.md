# 🚀 Express API 快速启动指南

## 📋 优化完成清单

✅ **依赖管理优化** - 更新package.json，移除重复依赖，添加开发工具  
✅ **代码质量工具** - ESLint + Prettier + 测试框架配置  
✅ **错误处理增强** - 统一错误处理中间件和自定义错误类  
✅ **性能监控** - API响应时间监控和系统资源监控  
✅ **Docker化部署** - 多环境Docker配置和容器编排  
✅ **CI/CD流水线** - GitHub Actions自动化测试和部署  
✅ **项目管理工具** - Makefile简化常用操作  

## 🛠️ 立即开始使用

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
# 复制环境配置文件
cp env/dev.env .env

# 根据你的环境修改配置
vim .env
```

### 3. 启动开发环境

#### 方式一：本地启动
```bash
npm run dev
```

#### 方式二：Docker启动（推荐）
```bash
# 使用Makefile快速启动
make quick-start

# 或者手动启动
docker-compose -f docker-compose.dev.yml up --build
```

### 4. 验证服务
```bash
# 健康检查
curl http://localhost:3000/health

# API文档
open http://localhost:3000/api-docs
```

## 🧪 运行测试

```bash
# 运行所有测试
npm test

# 监视模式运行测试
npm run test:watch

# 生成覆盖率报告
npm test -- --coverage
```

## 🔍 代码质量检查

```bash
# 运行ESLint检查
npm run lint

# 自动修复ESLint问题
npm run lint:fix

# 格式化代码
npm run format
```

## 🐳 Docker使用

### 开发环境
```bash
# 启动开发环境（包含热重载）
make dev-docker

# 启动开发工具（phpMyAdmin, Redis Commander等）
make tools-up

# 查看日志
make dev-logs

# 停止环境
make dev-stop
```

### 生产环境
```bash
# 启动生产环境
make prod-bg

# 查看日志
make prod-logs

# 停止环境
make prod-stop
```

## 📊 性能监控

### 查看性能统计
```bash
# 访问性能监控端点（需要在路由中添加）
curl http://localhost:3000/metrics

# 查看健康检查详情
curl http://localhost:3000/health
```

### 监控系统资源
```bash
# 使用Makefile监控
make monitor

# 手动查看Docker容器状态
docker stats
```

## 🔧 常用Makefile命令

```bash
make help           # 显示所有可用命令
make quick-start    # 快速启动开发环境
make test           # 运行测试
make lint           # 代码质量检查
make build          # 构建Docker镜像
make clean          # 清理临时文件
make backup-db      # 备份数据库
```

## 📁 新增文件说明

### 配置文件
- `.eslintrc.js` - ESLint代码质量检查配置
- `.prettierrc.js` - Prettier代码格式化配置
- `jest.config.js` - Jest测试框架配置
- `env/test.env` - 测试环境配置

### 中间件
- `middleware/errorHandler/index.js` - 统一错误处理
- `middleware/performance/index.js` - 性能监控

### 测试
- `tests/setup.js` - 测试环境设置
- `tests/app.test.js` - 应用程序测试示例

### Docker
- `Dockerfile` - 多阶段Docker构建
- `docker-compose.yml` - 生产环境容器编排
- `docker-compose.dev.yml` - 开发环境容器编排
- `.dockerignore` - Docker构建忽略文件

### 工具
- `Makefile` - 项目管理命令
- `.github/workflows/ci.yml` - CI/CD流水线

## 🚨 重要提醒

### 1. 环境配置
确保正确配置以下环境变量：
- 数据库连接信息
- Redis连接信息
- JWT密钥
- 其他第三方服务配置

### 2. 数据库初始化
首次运行需要同步数据库结构：
```bash
npm run db:sync
```

### 3. 生产环境部署
生产环境部署前请：
- 更新环境变量配置
- 运行完整测试套件
- 检查安全配置
- 备份现有数据

### 4. 监控和日志
- 定期检查应用日志
- 监控性能指标
- 设置告警机制

## 🔗 相关文档

- [完整优化建议](OPTIMIZATION_RECOMMENDATIONS.md)
- [故障排除指南](TROUBLESHOOTING.md)
- [API文档](http://localhost:3000/api-docs)
- [项目规则](RULES.md)

## 📞 获取帮助

如果遇到问题：
1. 查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. 检查应用日志：`make logs-tail`
3. 运行健康检查：`make health`
4. 查看Docker容器状态：`make monitor`

---

🎉 **恭喜！你的Express API项目已经完成优化，现在可以享受更好的开发体验了！**
