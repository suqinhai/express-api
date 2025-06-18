const sequelize = require('./mysql');
const routeHandler = require('./routeHandler');
const redis = require('./redis');
const cacheManager = require('./redis/cache');
const util = require('./util');
const schedule = require('./schedule');
const i18n = require('./i18n');
const logger = require('./logger');

module.exports = {
    ...util,
    ...routeHandler,
    sequelize,
    redis,
    cacheManager,
    schedule,
    ...i18n,
    ...logger
};



