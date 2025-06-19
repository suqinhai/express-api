const { sequelize } = require('../models');
const { logger } = require('../common/logger');

/**
 * 同步活动相关数据库表
 */
async function syncActivityDatabase() {
  try {
    logger.info('开始同步活动数据库表...', { category: 'DB_SYNC' });

    // 同步所有模型到数据库
    await sequelize.sync({ 
      force: false, // 设置为true会删除现有表重新创建，谨慎使用
      alter: true   // 自动修改表结构以匹配模型定义
    });

    logger.info('活动数据库表同步完成', { category: 'DB_SYNC' });

    // 插入默认数据
    await insertDefaultData();

    logger.info('活动系统初始化完成', { category: 'DB_SYNC' });

  } catch (error) {
    logger.error('活动数据库同步失败', { category: 'DB_SYNC', error });
    throw error;
  }
}

/**
 * 插入默认数据
 */
async function insertDefaultData() {
  try {
    // 动态加载活动模型
    const ActivityType = sequelize.models.ActivityType;
    const Activity = sequelize.models.Activity;
    const User = sequelize.models.User;

    if (!ActivityType) {
      logger.warn('ActivityType模型未找到，跳过默认数据插入', { category: 'DB_SYNC' });
      return;
    }

    // 检查并插入默认活动类型
    const existingTypes = await ActivityType.count();
    
    if (existingTypes === 0) {
      logger.info('插入默认活动类型...', { category: 'DB_SYNC' });
      
      // 获取系统管理员用户（假设ID为1）
      let adminUser = await User.findOne({ where: { role: 'admin' } });
      if (!adminUser) {
        // 如果没有管理员，创建一个默认管理员
        adminUser = await User.create({
          username: 'admin',
          password: '$2b$10$rQZ9QmjytWIeVX7uQRgzHOyxgXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // 默认密码: admin123
          email: 'admin@example.com',
          role: 'admin',
          status: 'active'
        });
        logger.info('创建默认管理员用户', { category: 'DB_SYNC', userId: adminUser.id });
      }

      const defaultTypes = [
        {
          name: '会议活动',
          code: 'meeting',
          description: '各类会议、研讨会、座谈会等活动',
          icon: 'meeting-icon',
          color: '#1890ff',
          sort_order: 1,
          default_duration: 120, // 2小时
          notification_settings: {
            email: true,
            sms: false,
            push: true,
            advance_notice: [24, 1], // 提前24小时和1小时通知
            reminder_enabled: true
          },
          template_settings: {
            required_fields: ['name', 'start_time', 'end_time', 'location'],
            optional_fields: ['description', 'max_participants'],
            default_values: {
              registration_required: true,
              is_public: true
            }
          },
          created_by: adminUser.id
        },
        {
          name: '培训活动',
          code: 'training',
          description: '培训课程、技能提升、学习交流等活动',
          icon: 'training-icon',
          color: '#52c41a',
          sort_order: 2,
          default_duration: 240, // 4小时
          notification_settings: {
            email: true,
            sms: true,
            push: true,
            advance_notice: [48, 24, 2], // 提前48小时、24小时和2小时通知
            reminder_enabled: true
          },
          template_settings: {
            required_fields: ['name', 'start_time', 'end_time', 'location', 'max_participants'],
            optional_fields: ['description', 'registration_deadline'],
            default_values: {
              registration_required: true,
              is_public: true
            }
          },
          created_by: adminUser.id
        },
        {
          name: '娱乐活动',
          code: 'entertainment',
          description: '聚会、游戏、娱乐、团建等活动',
          icon: 'entertainment-icon',
          color: '#fa8c16',
          sort_order: 3,
          default_duration: 180, // 3小时
          notification_settings: {
            email: false,
            sms: false,
            push: true,
            advance_notice: [24], // 提前24小时通知
            reminder_enabled: true
          },
          template_settings: {
            required_fields: ['name', 'start_time', 'end_time'],
            optional_fields: ['description', 'location', 'max_participants'],
            default_values: {
              registration_required: false,
              is_public: true
            }
          },
          created_by: adminUser.id
        },
        {
          name: '体育活动',
          code: 'sports',
          description: '运动比赛、健身活动、户外运动等',
          icon: 'sports-icon',
          color: '#eb2f96',
          sort_order: 4,
          default_duration: 120, // 2小时
          notification_settings: {
            email: true,
            sms: false,
            push: true,
            advance_notice: [24, 2], // 提前24小时和2小时通知
            reminder_enabled: true
          },
          template_settings: {
            required_fields: ['name', 'start_time', 'end_time', 'location'],
            optional_fields: ['description', 'max_participants', 'registration_deadline'],
            default_values: {
              registration_required: true,
              is_public: true
            }
          },
          created_by: adminUser.id
        },
        {
          name: '文化活动',
          code: 'culture',
          description: '文艺演出、展览、文化交流等活动',
          icon: 'culture-icon',
          color: '#722ed1',
          sort_order: 5,
          default_duration: 150, // 2.5小时
          notification_settings: {
            email: true,
            sms: false,
            push: true,
            advance_notice: [72, 24], // 提前72小时和24小时通知
            reminder_enabled: true
          },
          template_settings: {
            required_fields: ['name', 'start_time', 'end_time', 'location'],
            optional_fields: ['description', 'max_participants'],
            default_values: {
              registration_required: false,
              is_public: true
            }
          },
          created_by: adminUser.id
        },
        {
          name: '其他活动',
          code: 'other',
          description: '其他类型的活动',
          icon: 'other-icon',
          color: '#8c8c8c',
          sort_order: 99,
          default_duration: 60, // 1小时
          notification_settings: {
            email: false,
            sms: false,
            push: true,
            advance_notice: [24], // 提前24小时通知
            reminder_enabled: true
          },
          template_settings: {
            required_fields: ['name', 'start_time', 'end_time'],
            optional_fields: ['description', 'location', 'max_participants'],
            default_values: {
              registration_required: false,
              is_public: true
            }
          },
          created_by: adminUser.id
        }
      ];

      const createdTypes = await ActivityType.bulkCreate(defaultTypes);
      
      logger.info('默认活动类型创建完成', { 
        category: 'DB_SYNC',
        count: createdTypes.length
      });

      // 创建一个示例活动
      if (Activity) {
        const sampleActivity = await Activity.create({
          name: '系统初始化示例活动',
          type_id: createdTypes[0].id, // 使用第一个活动类型（会议活动）
          description: '这是一个系统初始化时创建的示例活动，您可以编辑或删除它。',
          start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 7天后+2小时
          status: 'draft',
          location: '示例地点',
          organizer_id: adminUser.id,
          created_by: adminUser.id,
          is_public: true,
          registration_required: false,
          priority: 0
        });

        logger.info('示例活动创建完成', { 
          category: 'DB_SYNC',
          activityId: sampleActivity.id
        });
      }
    }

    logger.info('默认数据检查完成', { category: 'DB_SYNC' });

  } catch (error) {
    logger.error('插入默认数据失败', { category: 'DB_SYNC', error });
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    await syncActivityDatabase();
    
    console.log('\n=== 活动系统数据库同步完成 ===');
    console.log('1. 数据库表已创建/更新');
    console.log('   - activities (活动主表)');
    console.log('   - activity_types (活动类型表)');
    console.log('   - activity_notifications (活动通知配置表)');
    console.log('2. 默认活动类型已创建');
    console.log('   - 会议活动、培训活动、娱乐活动、体育活动、文化活动、其他活动');
    console.log('3. 示例活动已创建');
    console.log('4. 系统已准备就绪');
    console.log('\nAPI文档: http://localhost:3000/api-docs');
    console.log('活动API示例:');
    console.log('  获取活动列表: GET /api/activities');
    console.log('  创建活动: POST /api/activities');
    console.log('  获取活动详情: GET /api/activities/{id}');
    console.log('  获取活动类型: GET /api/activities/types');
    console.log('\n管理员API示例:');
    console.log('  更新活动: PUT /api/activities/admin/{id}');
    console.log('  删除活动: DELETE /api/activities/admin/{id}');
    console.log('  更新活动状态: PUT /api/activities/admin/{id}/status');
    console.log('  获取活动统计: GET /api/activities/admin/statistics');
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('数据库同步失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  syncActivityDatabase,
  insertDefaultData
};
