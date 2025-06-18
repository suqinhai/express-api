module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/logs/',
    '/coverage/'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/logs/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!.eslintrc.js',
    '!.prettierrc.js',
    '!**/*.test.js',
    '!**/*.spec.js'
  ],
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // 覆盖率输出目录
  coverageDirectory: 'coverage',
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1'
  },
  
  // 全局变量
  globals: {
    'NODE_ENV': 'test'
  },
  
  // 测试超时时间（毫秒）
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 清除模拟
  clearMocks: true,
  restoreMocks: true,
  
  // 错误处理
  errorOnDeprecated: true,
  
  // 并发测试
  maxConcurrency: 5,
  
  // 监视模式配置
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/logs/',
    '/coverage/'
  ]
};
