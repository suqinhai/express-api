/**
 * 模型缓存中间件
 * 提供Sequelize模型级别的数据缓存功能，减少数据库查询次数
 */

const CacheManager = require('../../common/redis/cache');
const { TTL, PREFIX } = require('../../common/redis');
const { logger } = require('../../common/logger');
const { Op } = require('sequelize');

/**
 * 缓存模型查询装饰器
 * 包装Sequelize模型方法以提供缓存功能
 * 
 * @param {Object} model - Sequelize模型
 * @param {Object} options - 缓存选项
 * @returns {Object} 增强了缓存功能的模型
 */
function cacheableModel(model, options = {}) {
  const {
    prefix = PREFIX.USER,
    ttl = TTL.MEDIUM,
    methods = ['findByPk', 'findOne'],
    excludeFields = [],
    includeFields = null, // 设置为null表示包含所有字段
    disableCache = false // 全局禁用缓存的标志
  } = options;
  
  // 创建增强模型（代理原始模型）
  const enhancedModel = { ...model };
  
  // 遍历需要缓存的方法
  methods.forEach(methodName => {
    // 保存原始方法引用
    const originalMethod = model[methodName];
    
    // 重写方法以添加缓存功能
    enhancedModel[methodName] = async function(...args) {
      // 如果禁用了缓存，直接调用原始方法
      if (disableCache) {
        return originalMethod.apply(model, args);
      }
      
      // 从参数中提取选项
      const options = args[args.length - 1] || {};
      
      // 如果在当前查询中明确禁用了缓存，直接调用原始方法
      if (options.disableCache) {
        return originalMethod.apply(model, args);
      }
      
      // 生成缓存键
      let cacheKey;
      
      // 为不同方法生成不同的缓存键
      if (methodName === 'findByPk') {
        // findByPk(id, [options])
        const id = args[0];
        cacheKey = `${model.name}:pk:${id}`;
        
        // 添加事务标识（如果有）
        if (options.transaction) {
          return originalMethod.apply(model, args); // 事务中的查询不缓存
        }
      } else if (methodName === 'findOne') {
        // findOne(options)
        const queryOptions = args[0] || {};
        
        // 有些复杂查询不适合缓存
        if (
          queryOptions.include || // 关联查询
          queryOptions.transaction || // 事务中的查询
          (queryOptions.where && containsComplexOperators(queryOptions.where))
        ) {
          return originalMethod.apply(model, args);
        }
        
        // 基于查询条件生成缓存键
        const whereClause = queryOptions.where ? JSON.stringify(queryOptions.where) : 'all';
        const hashCode = hashString(whereClause);
        cacheKey = `${model.name}:one:${hashCode}`;
      } else {
        // 默认情况
        const hashCode = hashString(JSON.stringify(args));
        cacheKey = `${model.name}:${methodName}:${hashCode}`;
      }
      
      // 使用CacheManager的getOrFetch方法
      return CacheManager.getOrFetch(
        prefix,
        cacheKey,
        () => originalMethod.apply(model, args),
        ttl
      );
    };
  });
  
  // 增加清除模型缓存的方法
  enhancedModel.clearCache = async function(idOrPattern = null) {
    try {
      if (idOrPattern === null) {
        // 清除此模型的所有缓存
        return await CacheManager.clearByPattern(prefix, model.name);
      } else if (typeof idOrPattern === 'string' || typeof idOrPattern === 'number') {
        // 清除特定ID的缓存
        return await CacheManager.clearByPattern(prefix, `${model.name}:pk:${idOrPattern}`);
      } else {
        // 使用模式清除
        return await CacheManager.clearByPattern(prefix, idOrPattern);
      }
    } catch (error) {
      logger.error(`清除模型缓存失败: ${model.name}`, {
        category: 'CACHE',
        error: error
      });
      return [];
    }
  };
  
  return enhancedModel;
}

/**
 * 在hooks中自动清除缓存的模型装饰器
 * 
 * @param {Object} model - Sequelize模型
 * @param {Object} options - 缓存选项
 * @returns {Object} 增强了自动缓存清除的模型
 */
function autoCacheClearModel(model, options = {}) {
  const {
    prefix = PREFIX.USER,
    hooks = ['afterCreate', 'afterUpdate', 'afterDestroy', 'afterBulkCreate', 'afterBulkUpdate', 'afterBulkDestroy']
  } = options;
  
  // 首先应用基本缓存增强
  const cachedModel = cacheableModel(model, options);
  
  // 添加hooks用于自动清除缓存
  hooks.forEach(hookName => {
    model.addHook(hookName, async (instance, options) => {
      try {
        // 对于批量操作，清除整个模型的缓存
        if (hookName.includes('Bulk')) {
          await CacheManager.clearByPattern(prefix, model.name);
          logger.debug(`在${hookName}后清除了${model.name}的所有缓存`, { category: 'CACHE' });
          return;
        }
        
        // 对于单个实例操作，如果有ID则只清除相关缓存
        if (instance && instance.id) {
          await CacheManager.clearByPattern(prefix, `${model.name}:pk:${instance.id}`);
          logger.debug(`在${hookName}后清除了${model.name}:${instance.id}的缓存`, { category: 'CACHE' });
        } else {
          // 如果没有实例ID，清除整个模型的缓存
          await CacheManager.clearByPattern(prefix, model.name);
          logger.debug(`在${hookName}后清除了${model.name}的所有缓存`, { category: 'CACHE' });
        }
      } catch (error) {
        logger.error(`自动清除缓存失败: ${model.name}`, {
          category: 'CACHE',
          error: error,
          hook: hookName
        });
      }
    });
  });
  
  return cachedModel;
}

/**
 * 判断查询条件中是否包含复杂操作符
 * 
 * @param {Object} where - 查询条件对象
 * @returns {boolean} 是否包含复杂操作符
 */
function containsComplexOperators(where) {
  if (!where || typeof where !== 'object') {
    return false;
  }
  
  // 复杂操作符列表
  const complexOperators = [
    Op.or, Op.and, Op.not, Op.notIn, Op.like, Op.notLike,
    Op.regexp, Op.notRegexp, Op.between, Op.notBetween
  ];
  
  return Object.keys(where).some(key => {
    // 检查键是否为复杂操作符
    if (complexOperators.includes(key)) {
      return true;
    }
    
    // 递归检查嵌套对象
    if (where[key] && typeof where[key] === 'object') {
      return containsComplexOperators(where[key]);
    }
    
    return false;
  });
}

/**
 * 简单的字符串哈希函数
 * 
 * @param {string} str - 要哈希的字符串
 * @returns {string} 哈希结果
 */
function hashString(str) {
  let hash = 0;
  
  if (str.length === 0) {
    return hash.toString();
  }
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return hash.toString();
}

module.exports = {
  cacheableModel,
  autoCacheClearModel
}; 