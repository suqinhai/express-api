# Express API 问题排查指南

## 常见问题及解决方案

### 1. `logger is not defined` 错误

**问题描述**：
在启动应用时出现 `ReferenceError: logger is not defined` 错误，通常发生在 `app.js` 文件中。

**解决方案**：
1. 检查 `common/index.js` 文件，确保正确导出了 logger 模块：
   ```javascript
   const logger = require('./logger');
   
   module.exports = {
       // 其他导出...
       ...logger
   };
   ```

2. 在 `app.js` 中，确保从正确的模块导入 logger：
   ```javascript
   // 方法1: 直接从logger模块导入
   var { requestLogger, logger } = require('./common/logger');
   
   // 方法2: 从common/index.js导入
   var { requestLogger, logger } = require('./common/index');
   ```

3. 避免名称冲突，如果同时使用 morgan 和自定义 logger：
   ```javascript
   var morganLogger = require('morgan');  // 重命名morgan日志器
   var { requestLogger, logger } = require('./common/logger');
   ```

### 2. 端口已被占用 `Port XXXX is already in use`

**问题描述**：
启动服务器时提示端口已被占用，如 `Port 3001 is already in use`。

**解决方案**：
1. 使用项目中的端口终止脚本：
   ```
   node scripts/kill-port.js 3001
   ```

2. 在Windows系统中手动终止占用端口的进程：
   ```
   netstat -ano | findstr :3001  # 查找占用端口的进程PID
   taskkill /F /PID <PID>        # 终止指定PID的进程
   ```

3. 在Linux/Mac系统中：
   ```
   lsof -i :3001 | grep LISTEN   # 查找占用端口的进程PID
   kill -9 <PID>                 # 终止指定PID的进程
   ```

4. 修改配置使用不同端口：
   - 在环境文件中设置不同的端口（如 `env/dev.env`）
   - 使用命令行参数设置端口：`set PORT=3002 && npm start`

### 3. 环境配置文件找不到

**问题描述**：
应用启动时无法找到环境配置文件，可能导致配置缺失或加载错误的配置。

**解决方案**：
1. 检查环境文件命名格式和位置：
   - `/env/development.env`
   - `/env/dev.env`
   - `/env/.env.development`

2. 设置正确的环境变量：
   ```
   set NODE_ENV=dev && npm start
   ```

3. 使用项目中的工具函数 `getEnvPath()` 检查实际寻找的文件路径

### 4. 快速启动

推荐使用项目中的开发环境启动脚本，它会自动处理常见问题：

```
node start-dev.js
```

此脚本会:
- 检查并释放被占用的端口
- 设置正确的环境变量
- 使用nodemon启动应用，支持热重载

## 查看日志

本项目使用了多层次的日志系统：

1. 应用日志: `logs/%DATE%-app.log`
2. 错误日志: `logs/%DATE%-error.log`
3. 数据库日志: `logs/%DATE%-database.log`
4. 集群日志: `logs/%DATE%-cluster.log`

## 其他资源

- API文档: http://localhost:3002/api-docs
- 健康检查: http://localhost:3002/healthcheck 