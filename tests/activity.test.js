/**
 * 活动功能单元测试
 * 测试活动相关的API接口和业务逻辑
 */

const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const ActivityService = require('../services/activities/ActivityService');

describe('活动管理API测试', () => {
  let authToken;
  let adminToken;
  let testUser;
  let adminUser;
  let activityType;
  let testActivity;

  // 测试前的设置
  beforeAll(async () => {
    // 确保数据库连接
    await sequelize.authenticate();
    
    // 同步数据库表（测试环境）
    await sequelize.sync({ force: true });
    
    // 创建测试用户
    testUser = await sequelize.models.User.create({
      username: 'testuser',
      password: '$2b$10$rQZ9QmjytWIeVX7uQRgzHOyxgXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      email: 'test@example.com',
      role: 'user',
      status: 'active'
    });

    // 创建管理员用户
    adminUser = await sequelize.models.User.create({
      username: 'admin',
      password: '$2b$10$rQZ9QmjytWIeVX7uQRgzHOyxgXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active'
    });

    // 创建测试活动类型
    activityType = await sequelize.models.ActivityType.create({
      name: '测试活动类型',
      code: 'test_type',
      description: '用于测试的活动类型',
      is_active: true,
      created_by: adminUser.id
    });

    // 获取认证token
    const userLoginRes = await request(app)
      .post('/api/users/login')
      .send({
        username: 'testuser',
        password: 'admin123'
      });
    authToken = userLoginRes.body.data.token;

    const adminLoginRes = await request(app)
      .post('/api/users/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    adminToken = adminLoginRes.body.data.token;
  });

  // 测试后的清理
  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/activities/types', () => {
    test('应该成功获取活动类型列表', async () => {
      const response = await request(app)
        .get('/api/activities/types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('code');
    });

    test('未认证用户应该返回401', async () => {
      await request(app)
        .get('/api/activities/types')
        .expect(401);
    });
  });

  describe('POST /api/activities', () => {
    test('应该成功创建活动', async () => {
      const activityData = {
        name: '测试活动',
        type_id: activityType.id,
        description: '这是一个测试活动',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 明天+1小时
        location: '测试地点',
        is_public: true,
        registration_required: false
      };

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(activityData)
        .expect(201);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(activityData.name);
      expect(response.body.data.status).toBe('draft');
      
      testActivity = response.body.data;
    });

    test('缺少必填字段应该返回400', async () => {
      const invalidData = {
        name: '测试活动'
        // 缺少其他必填字段
      };

      await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    test('开始时间晚于结束时间应该返回400', async () => {
      const invalidData = {
        name: '测试活动',
        type_id: activityType.id,
        start_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/activities', () => {
    test('应该成功获取活动列表', async () => {
      const response = await request(app)
        .get('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('activities');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.activities).toBeInstanceOf(Array);
    });

    test('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/activities?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    test('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/activities?status=draft')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    test('应该支持搜索功能', async () => {
      const response = await request(app)
        .get('/api/activities?search=测试')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('GET /api/activities/:id', () => {
    test('应该成功获取活动详情', async () => {
      const response = await request(app)
        .get(`/api/activities/${testActivity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.id).toBe(testActivity.id);
      expect(response.body.data).toHaveProperty('activityType');
      expect(response.body.data).toHaveProperty('organizer');
    });

    test('不存在的活动应该返回404', async () => {
      await request(app)
        .get('/api/activities/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('无效的活动ID应该返回400', async () => {
      await request(app)
        .get('/api/activities/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PUT /api/activities/admin/:id', () => {
    test('管理员应该能够更新活动', async () => {
      const updateData = {
        name: '更新后的活动名称',
        description: '更新后的描述'
      };

      const response = await request(app)
        .put(`/api/activities/admin/${testActivity.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    test('普通用户应该无法访问管理员接口', async () => {
      const updateData = {
        name: '尝试更新'
      };

      await request(app)
        .put(`/api/activities/admin/${testActivity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('PUT /api/activities/admin/:id/status', () => {
    test('管理员应该能够更新活动状态', async () => {
      const response = await request(app)
        .put(`/api/activities/admin/${testActivity.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.status).toBe('active');
    });

    test('无效的状态应该返回400', async () => {
      await request(app)
        .put(`/api/activities/admin/${testActivity.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });
  });

  describe('GET /api/activities/admin/statistics', () => {
    test('管理员应该能够获取活动统计信息', async () => {
      const response = await request(app)
        .get('/api/activities/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('by_status');
      expect(response.body.data).toHaveProperty('by_type');
      expect(response.body.data).toHaveProperty('recent_activities');
    });
  });

  describe('DELETE /api/activities/admin/:id', () => {
    test('管理员应该能够删除活动', async () => {
      const response = await request(app)
        .delete(`/api/activities/admin/${testActivity.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    test('删除后活动应该不存在', async () => {
      await request(app)
        .get(`/api/activities/${testActivity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

describe('ActivityService 单元测试', () => {
  let activityService;
  let testUser;
  let activityType;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    
    activityService = new ActivityService(sequelize);
    
    testUser = await sequelize.models.User.create({
      username: 'servicetest',
      password: 'password',
      email: 'service@example.com',
      role: 'user',
      status: 'active'
    });

    activityType = await sequelize.models.ActivityType.create({
      name: '服务测试类型',
      code: 'service_test',
      is_active: true,
      created_by: testUser.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('createActivity', () => {
    test('应该成功创建活动', async () => {
      const activityData = {
        name: '服务测试活动',
        type_id: activityType.id,
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000),
        description: '测试描述'
      };

      const activity = await activityService.createActivity(activityData, testUser.id);
      
      expect(activity).toHaveProperty('id');
      expect(activity.name).toBe(activityData.name);
      expect(activity.created_by).toBe(testUser.id);
    });

    test('无效的活动类型应该抛出错误', async () => {
      const activityData = {
        name: '测试活动',
        type_id: 99999,
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000)
      };

      await expect(activityService.createActivity(activityData, testUser.id))
        .rejects.toThrow('活动类型不存在或已禁用');
    });
  });

  describe('isValidStatusTransition', () => {
    test('应该正确验证状态转换', () => {
      expect(activityService.isValidStatusTransition('draft', 'active')).toBe(true);
      expect(activityService.isValidStatusTransition('active', 'paused')).toBe(true);
      expect(activityService.isValidStatusTransition('completed', 'active')).toBe(false);
      expect(activityService.isValidStatusTransition('cancelled', 'active')).toBe(false);
    });
  });
});
