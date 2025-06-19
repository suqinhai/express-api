const cron = require('node-cron');
const { logger } = require('../logger');

/**
 * 定时任务管理器
 */
class ScheduleManager {
  constructor() {
    this.tasks = new Map();
    this.paymentEngine = null;
  }

  /**
   * 设置支付引擎实例
   * @param {Object} engine 支付引擎实例
   */
  setPaymentEngine(engine) {
    this.paymentEngine = engine;
  }

  /**
   * 启动所有定时任务
   */
  start() {
    logger.info('启动定时任务管理器', { category: 'SCHEDULE' });

    // 示例：每天凌晨2点执行数据清理
    this.addTask('daily-cleanup', '0 2 * * *', () => {
      this.dailyCleanup();
    });

    // 示例：每小时执行一次健康检查
    this.addTask('health-check', '0 * * * *', () => {
      this.healthCheck();
    });

    // 支付相关定时任务
    // 每5分钟检查并处理过期订单
    this.addTask('process-expired-orders', '*/5 * * * *', () => {
      this.processExpiredOrders();
    });

    // 每30分钟同步未完成订单状态
    this.addTask('sync-pending-orders', '*/30 * * * *', () => {
      this.syncPendingOrders();
    });

    logger.info('所有定时任务已启动', { category: 'SCHEDULE' });
  }

  /**
   * 添加定时任务
   * @param {string} name 任务名称
   * @param {string} schedule cron表达式
   * @param {Function} task 任务函数
   */
  addTask(name, schedule, task) {
    try {
      const cronTask = cron.schedule(schedule, task, {
        scheduled: false,
        timezone: 'Asia/Shanghai'
      });

      this.tasks.set(name, cronTask);
      cronTask.start();

      logger.info(`定时任务已添加: ${name}`, {
        category: 'SCHEDULE',
        schedule
      });
    } catch (error) {
      logger.error(`添加定时任务失败: ${name}`, {
        category: 'SCHEDULE',
        error
      });
    }
  }

  /**
   * 停止定时任务
   * @param {string} name 任务名称
   */
  stopTask(name) {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      logger.info(`定时任务已停止: ${name}`, { category: 'SCHEDULE' });
    }
  }

  /**
   * 停止所有定时任务
   */
  stopAll() {
    for (const [name, task] of this.tasks) {
      task.stop();
      logger.info(`定时任务已停止: ${name}`, { category: 'SCHEDULE' });
    }
    this.tasks.clear();
    logger.info('所有定时任务已停止', { category: 'SCHEDULE' });
  }

  /**
   * 每日数据清理任务
   */
  async dailyCleanup() {
    try {
      logger.info('开始执行每日数据清理', { category: 'SCHEDULE' });

      // 这里可以添加具体的清理逻辑
      // 例如：清理过期的缓存、日志文件等

      logger.info('每日数据清理完成', { category: 'SCHEDULE' });
    } catch (error) {
      logger.error('每日数据清理失败', { category: 'SCHEDULE', error });
    }
  }

  /**
   * 健康检查任务
   */
  async healthCheck() {
    try {
      logger.info('开始执行健康检查', { category: 'SCHEDULE' });

      // 这里可以添加具体的健康检查逻辑
      // 例如：检查数据库连接、外部服务状态等

      logger.info('健康检查完成', { category: 'SCHEDULE' });
    } catch (error) {
      logger.error('健康检查失败', { category: 'SCHEDULE', error });
    }
  }

  /**
   * 处理过期订单
   */
  async processExpiredOrders() {
    try {
      if (!this.paymentEngine) {
        return;
      }

      logger.info('开始处理过期订单', { category: 'SCHEDULE' });

      await this.paymentEngine.orderManager.processExpiredOrders();

      logger.info('过期订单处理完成', { category: 'SCHEDULE' });
    } catch (error) {
      logger.error('处理过期订单失败', { category: 'SCHEDULE', error });
    }
  }

  /**
   * 同步未完成订单状态
   */
  async syncPendingOrders() {
    try {
      if (!this.paymentEngine) {
        return;
      }

      logger.info('开始同步未完成订单状态', { category: 'SCHEDULE' });

      const { paymentOrderModel } = require('../../models');
      const { Op } = require('sequelize');

      // 获取24小时内的未完成订单
      const pendingOrders = await paymentOrderModel.findAll({
        where: {
          status: ['pending', 'processing'],
          created_at: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
          }
        },
        limit: 50 // 限制每次处理的订单数量
      });

      let syncCount = 0;
      for (const order of pendingOrders) {
        try {
          await this.paymentEngine.queryOrder(order.order_no);
          syncCount++;
        } catch (error) {
          logger.warn('同步订单状态失败', {
            category: 'SCHEDULE',
            orderNo: order.order_no,
            error: error.message
          });
        }
      }

      logger.info('未完成订单状态同步完成', {
        category: 'SCHEDULE',
        totalOrders: pendingOrders.length,
        syncedOrders: syncCount
      });
    } catch (error) {
      logger.error('同步未完成订单状态失败', { category: 'SCHEDULE', error });
    }
  }
}

// 创建全局实例
const scheduleManager = new ScheduleManager();

module.exports = scheduleManager;