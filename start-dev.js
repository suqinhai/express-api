#!/usr/bin/env node

/**
 * 开发环境启动脚本
 * 用法: node start-dev.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const isWin = process.platform === 'win32';
const port = 3002; // 开发环境端口

// 打印彩色文本
const color = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${color.cyan}========================================${color.reset}`);
console.log(`${color.cyan}  Express API 开发环境启动脚本${color.reset}`);
console.log(`${color.cyan}========================================${color.reset}`);

// 确保环境文件存在
const envPath = path.resolve(__dirname, 'env/dev.env');
if (!fs.existsSync(envPath)) {
  console.log(`${color.yellow}警告: 未找到环境配置文件 ${envPath}${color.reset}`);
  console.log(`${color.yellow}将尝试使用默认配置${color.reset}`);
}

// 检查是否有其他进程占用端口
try {
  console.log(`${color.blue}检查端口 ${port} 是否被占用...${color.reset}`);
  
  let command;
  if (isWin) {
    command = `netstat -ano | findstr :${port}`;
  } else {
    command = `lsof -i :${port} | grep LISTEN`;
  }
  
  const result = execSync(command, { encoding: 'utf8' });
  if (result && result.trim()) {
    console.log(`${color.red}端口 ${port} 已被占用:${color.reset}`);
    console.log(result);
    console.log(`${color.yellow}尝试终止占用端口的进程...${color.reset}`);
    
    // 提取PID
    let pid;
    if (isWin) {
      const match = result.trim().match(/\s+(\d+)$/m);
      if (match && match[1]) {
        pid = match[1];
      }
    } else {
      const match = result.trim().split(/\s+/)[1];
      if (match) {
        pid = match;
      }
    }
    
    if (pid) {
      const killCommand = isWin ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
      execSync(killCommand);
      console.log(`${color.green}已终止PID为 ${pid} 的进程${color.reset}`);
    } else {
      console.log(`${color.red}无法确定PID，请手动终止进程${color.reset}`);
      process.exit(1);
    }
  } else {
    console.log(`${color.green}端口 ${port} 可用${color.reset}`);
  }
} catch (error) {
  // 如果命令执行失败但不是因为找不到占用的进程，则输出错误信息
  if (!error.message.includes('No such process') && !error.message.includes('没有')) {
    console.error(`${color.red}检查端口时出错: ${error.message}${color.reset}`);
  }
  console.log(`${color.green}端口 ${port} 可用${color.reset}`);
}

console.log(`${color.blue}正在启动应用...${color.reset}`);
console.log(`${color.blue}环境: dev, 端口: ${port}${color.reset}`);

// 设置环境变量
process.env.NODE_ENV = 'dev';
process.env.PORT = port.toString();

// 使用nodemon启动应用
const nodemonPath = path.resolve(__dirname, 'node_modules', '.bin', isWin ? 'nodemon.cmd' : 'nodemon');
if (!fs.existsSync(nodemonPath)) {
  console.log(`${color.red}未找到 nodemon，正在安装...${color.reset}`);
  execSync('npm install nodemon --save-dev', { stdio: 'inherit' });
}

try {
  const nodemon = spawn(nodemonPath, ['./bin/www'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'dev', PORT: port.toString() }
  });
  
  nodemon.on('error', (error) => {
    console.error(`${color.red}启动 nodemon 失败: ${error.message}${color.reset}`);
  });
  
  // 处理进程退出
  process.on('SIGINT', () => {
    nodemon.kill();
    console.log(`\n${color.yellow}应用已停止${color.reset}`);
    process.exit(0);
  });
} catch (error) {
  console.error(`${color.red}启动失败: ${error.message}${color.reset}`);
} 