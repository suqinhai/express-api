/**
 * 基础服务类
 * 提供通用的服务功能和方法
 * 所有服务都应该继承此类
 */

const { logger } = require('../../common/logger');
const { cacheManager } = require('../../common');

class BaseService {
  constructor() {
    this.logger = logger;
    this.cache = cacheManager;
  }

  /**
   * 执行数据库事务
   * @param {Function} callback - 事务回调函数
   * @param {Object} sequelize - Sequelize实例
   * @returns {Promise} 事务结果
   */
  async executeTransaction(callback, sequelize) {
    const transaction = await sequelize.transaction();
    
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 缓存获取或设置
   * @param {string} key - 缓存键
   * @param {Function} fetchFunction - 数据获取函数
   * @param {number} ttl - 缓存时间(秒)
   * @returns {Promise} 缓存数据
   */
  async getOrSetCache(key, fetchFunction, ttl = 3600) {
    try {
      // 尝试从缓存获取
      const cachedData = await this.cache.get('service', key);
      if (cachedData !== null) {
        return cachedData;
      }

      // 从数据源获取
      const freshData = await fetchFunction();
      
      // 设置缓存
      if (freshData !== null && freshData !== undefined) {
        await this.cache.set('service', key, freshData, ttl);
      }

      return freshData;
    } catch (error) {
      this.logger.error('缓存操作失败', { key, error: error.message });
      // 缓存失败时直接返回数据
      return await fetchFunction();
    }
  }

  /**
   * 清除相关缓存
   * @param {string|Array} keys - 缓存键或键数组
   */
  async clearCache(keys) {
    try {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      
      for (const key of keyArray) {
        await this.cache.del('service', key);
      }
      
      this.logger.info('缓存清除成功', { keys: keyArray });
    } catch (error) {
      this.logger.error('缓存清除失败', { keys, error: error.message });
    }
  }

  /**
   * 数据验证
   * @param {Object} data - 待验证数据
   * @param {Object} rules - 验证规则
   * @returns {Object} 验证结果
   */
  validateData(data, rules) {
    const errors = [];

    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = data[field];

      // 必需字段验证
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: `${field} 是必需的`
        });
        return;
      }

      // 如果字段为空且不是必需的，跳过其他验证
      if (value === undefined || value === null || value === '') {
        return;
      }

      // 类型验证
      if (rule.type) {
        const actualType = typeof value;
        if (actualType !== rule.type) {
          errors.push({
            field,
            message: `${field} 必须是 ${rule.type} 类型`
          });
        }
      }

      // 长度验证
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field} 长度不能少于 ${rule.minLength} 个字符`
        });
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field} 长度不能超过 ${rule.maxLength} 个字符`
        });
      }

      // 数值范围验证
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field,
          message: `${field} 不能小于 ${rule.min}`
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field,
          message: `${field} 不能大于 ${rule.max}`
        });
      }

      // 正则表达式验证
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: rule.patternMessage || `${field} 格式不正确`
        });
      }

      // 枚举值验证
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field,
          message: `${field} 必须是以下值之一: ${rule.enum.join(', ')}`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 构建查询条件
   * @param {Object} filters - 过滤条件
   * @param {Array} allowedFields - 允许的字段
   * @returns {Object} 查询条件
   */
  buildWhereCondition(filters, allowedFields = []) {
    const where = {};

    Object.keys(filters).forEach(key => {
      if (allowedFields.length > 0 && !allowedFields.includes(key)) {
        return;
      }

      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        where[key] = value;
      }
    });

    return where;
  }

  /**
   * 记录服务操作日志
   * @param {string} action - 操作类型
   * @param {Object} details - 详细信息
   */
  logAction(action, details = {}) {
    this.logger.info(`服务操作: ${action}`, {
      service: this.constructor.name,
      action,
      ...details
    });
  }

  /**
   * 记录服务错误日志
   * @param {string} action - 操作类型
   * @param {Error} error - 错误对象
   * @param {Object} details - 详细信息
   */
  logError(action, error, details = {}) {
    this.logger.error(`服务错误: ${action}`, {
      service: this.constructor.name,
      action,
      error: error.message,
      stack: error.stack,
      ...details
    });
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 格式化日期
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date) {
    return new Date(date).toISOString();
  }

  /**
   * 深度克隆对象
   * @param {Object} obj - 待克隆对象
   * @returns {Object} 克隆后的对象
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}

module.exports = BaseService;
