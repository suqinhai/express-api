/**
 * Jest 测试环境设置文件
 * 在所有测试运行前执行的全局设置
 */

const dotenv = require('dotenv');
const path = require('path');

// 加载测试环境变量
dotenv.config({
  path: path.resolve(__dirname, '../env/test.env')
});

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.DB_NAME = 'test_db';
process.env.REDIS_DB = '1';

// 全局测试超时时间
jest.setTimeout(10000);

// 全局测试前置操作
beforeAll(async () => {
  // 这里可以添加全局的测试前置操作
  // 例如：数据库连接、Redis连接等
  console.log('🧪 测试环境初始化...');
});

// 全局测试后置操作
afterAll(async () => {
  // 这里可以添加全局的测试后置操作
  // 例如：关闭数据库连接、清理测试数据等
  console.log('🧹 测试环境清理...');
});

// 每个测试前的操作
beforeEach(() => {
  // 清除所有模拟
  jest.clearAllMocks();
});

// 每个测试后的操作
afterEach(() => {
  // 恢复所有模拟
  jest.restoreAllMocks();
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('测试中发现未处理的Promise拒绝:', reason);
  throw reason;
});

process.on('uncaughtException', (error) => {
  console.error('测试中发现未捕获的异常:', error);
  throw error;
});

// 导出测试工具函数
global.testUtils = {
  // 创建模拟请求对象
  createMockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    method: 'GET',
    url: '/',
    ...overrides
  }),

  // 创建模拟响应对象
  createMockRes: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      render: jest.fn().mockReturnThis(),
      locals: {}
    };
    return res;
  },

  // 创建模拟next函数
  createMockNext: () => jest.fn(),

  // 等待异步操作
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // 生成随机字符串
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // 生成随机邮箱
  randomEmail: () => {
    const username = global.testUtils.randomString(8);
    return `${username}@test.com`;
  }
};

console.log('✅ Jest 测试环境设置完成');
