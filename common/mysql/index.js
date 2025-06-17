const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
const { getEnvPath } = require('../util');

// 加载环境变量
dotenv.config({
    path: getEnvPath()
});

// 从环境变量获取数据库配置
const config = {
    dialect: process.env.DB_DIALECT || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_DATABASE || 'testSxx',
    // 连接池配置
    pool: {
        max: parseInt(process.env.DB_POOL_MAX) || 10,
        min: parseInt(process.env.DB_POOL_MIN) || 0,
        acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
        idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    // 额外配置
    define: {
        timestamps: false,  // 默认不使用 createAt 和 updateAt
        underscored: false,  // 将驼峰命名转换为下划线命名
        freezeTableName: true  // 表名与模型名保持一致
    },
    // 日志配置
    logging: process.env.NODE_ENV === 'dev' ? console.log : false,
    dialectOptions: {
        // 处理时区问题
        timezone: '+08:00'
    }
};

// 初始化 Sequelize 实例
const sequelize = new Sequelize(config);

// 测试连接并进行健康检查
async function connection() {
    try {
        // 测试连接
        await sequelize.authenticate();
        console.log('成功连接到 MySQL 数据库!');
    } catch (error) {
        console.error('MySQL 连接失败:', error);
        
        // 如果在开发环境中，可以尝试重连
        if (process.env.NODE_ENV === 'dev') {
            console.log('5秒后尝试重新连接...');
            setTimeout(connection, 5000);
        }
    }
}

// 执行连接
connection();

// 导出 Sequelize 实例
module.exports = sequelize;