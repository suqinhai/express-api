const Redis = require('ioredis');

// 创建 Redis 客户端
const redis = new Redis({
  host: 'localhost', // Redis 服务器地址
  port: 6379,       // 默认端口
  password: '', // 如果有密码
  db: 0             // 选择数据库（默认 0）
});

// 连接成功事件
redis.on('connect', () => {
  console.log('Connected to Redis');
});

// 连接错误事件
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = redis;


// 示例：设置和获取键值
// async function example() {
//   try {
//     // 设置键值
//     await redis.set('key', 'Hello, Redis!');
//     // 设置过期时间（秒）
//     await redis.expire('key', 60);

//     // 获取键值
//     const value = await redis.get('key');
//     console.log('Value:', value);

//     // 关闭连接
//     await redis.quit();
//   } catch (err) {
//     console.error('Error:', err);
//   }
// }

// example();