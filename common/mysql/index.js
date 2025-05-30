const { Sequelize } = require('sequelize');

// 初始化 Sequelize
const sequelize = new Sequelize({
    dialect: 'mysql',                     // 使用 MySQL 协议
    host: 'localhost',                      // 替换为 OceanBase 主机地址
    port: 3306,                          // OceanBase 默认端口
    username: 'root',                    // 替换为你的用户名
    password: '123456',                // 替换为你的密码
    database: 'testSxx'       // 替换为你的数据库名
});
async function connection() {
    try {
        // 测试连接
        await sequelize.authenticate();
        console.log('成功连接到 MySQL!');
    } catch (error) {
        console.error('连接或操作失败:', error);
    }
}

connection();

module.exports = sequelize




