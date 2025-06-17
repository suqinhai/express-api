const path = require('path');
const clusterLogger = require('../logger/clusterLogger');

/**
 * 获取环境变量配置文件路径
 * @returns {string} 环境变量文件路径
 */
function getEnvPath() {
    return path.resolve(__dirname, ('../../env/.env.' + process.env.NODE_ENV));
}

module.exports = {
    getEnvPath,
    clusterLogger,
};
