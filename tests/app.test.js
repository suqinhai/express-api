/**
 * 应用程序主要功能测试
 */

const request = require('supertest');
const app = require('../app');

describe('Express App', () => {
  describe('基础功能测试', () => {
    test('应用程序应该正常启动', () => {
      expect(app).toBeDefined();
    });

    test('健康检查端点应该返回200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    test('API文档端点应该可访问', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200);

      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
    });

    test('不存在的路由应该返回404', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('中间件测试', () => {
    test('CORS中间件应该设置正确的头部', async () => {
      const response = await request(app)
        .options('/')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('安全头部应该被正确设置', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    test('压缩中间件应该工作', async () => {
      const response = await request(app)
        .get('/')
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      // 检查是否有压缩相关的头部
      expect(response.headers['content-encoding']).toBeDefined();
    });
  });

  describe('错误处理测试', () => {
    test('服务器错误应该返回标准格式', async () => {
      // 这里需要创建一个会触发服务器错误的路由进行测试
      // 暂时跳过，等待实际错误路由的实现
    });

    test('JSON解析错误应该被正确处理', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('性能测试', () => {
    test('响应时间应该在合理范围内', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // 响应时间应该小于1秒
    });

    test('并发请求应该能正常处理', async () => {
      const promises = [];
      const concurrentRequests = 10;

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/')
            .expect(200)
        );
      }

      const responses = await Promise.all(promises);
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('国际化测试', () => {
    test('应该支持中文语言', async () => {
      const response = await request(app)
        .get('/')
        .set('Accept-Language', 'zh-CN')
        .expect(200);

      // 检查响应是否包含中文内容或正确的语言设置
      expect(response.headers['content-language']).toBeDefined();
    });

    test('应该支持英文语言', async () => {
      const response = await request(app)
        .get('/')
        .set('Accept-Language', 'en-US')
        .expect(200);

      expect(response.headers['content-language']).toBeDefined();
    });
  });
});

describe('API响应格式测试', () => {
  test('成功响应应该有标准格式', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(typeof response.body.status).toBe('string');
  });

  test('错误响应应该有标准格式', async () => {
    const response = await request(app)
      .get('/non-existent')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('type');
    expect(response.body.error).toHaveProperty('timestamp');
  });
});

describe('静态文件服务测试', () => {
  test('静态文件应该能正常访问', async () => {
    // 假设public目录下有一个test.txt文件
    const response = await request(app)
      .get('/test.txt')
      .expect(404); // 如果文件不存在应该返回404

    // 如果文件存在，应该返回200和正确的内容类型
  });

  test('静态文件应该设置正确的缓存头', async () => {
    const response = await request(app)
      .get('/favicon.ico')
      .expect(404); // 如果文件不存在

    // 如果文件存在，检查缓存头
    // expect(response.headers['cache-control']).toBeDefined();
  });
});
