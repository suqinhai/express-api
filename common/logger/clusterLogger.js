const cluster = require('cluster');

/**
 * 集群日志记录类
 */
class ClusterLogger {
    /**
     * 创建一个新的集群日志记录实例
     */
    constructor() {
        this.isMaster = cluster.isMaster;
        this.pid = process.pid;
    }

    /**
     * 获取当前时间的格式化字符串
     * @returns {string} 格式化的时间字符串
     */
    getTimeString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    }

    /**
     * 记录普通消息
     * @param {string} message - 要记录的消息
     */
    log(message) {
        const timeString = this.getTimeString();
        const processType = this.isMaster ? '主进程' : '工作进程';
        console.log(`[${timeString}] [${processType} ${this.pid}] ${message}`);
    }

    /**
     * 记录信息消息
     * @param {string} message - 要记录的消息
     */
    info(message) {
        const timeString = this.getTimeString();
        const processType = this.isMaster ? '主进程' : '工作进程';
        console.info(`[${timeString}] [${processType} ${this.pid}] [INFO] ${message}`);
    }

    /**
     * 记录警告消息
     * @param {string} message - 要记录的消息
     */
    warn(message) {
        const timeString = this.getTimeString();
        const processType = this.isMaster ? '主进程' : '工作进程';
        console.warn(`[${timeString}] [${processType} ${this.pid}] [WARN] ${message}`);
    }

    /**
     * 记录错误消息
     * @param {string} message - 要记录的消息
     * @param {Error} [error] - 相关的错误对象
     */
    error(message, error = null) {
        const timeString = this.getTimeString();
        const processType = this.isMaster ? '主进程' : '工作进程';
        
        if (error) {
            console.error(`[${timeString}] [${processType} ${this.pid}] [ERROR] ${message}`, error);
        } else {
            console.error(`[${timeString}] [${processType} ${this.pid}] [ERROR] ${message}`);
        }
    }
    
    /**
     * 记录集群事件
     * @param {string} eventType - 事件类型
     * @param {string} message - 事件消息
     * @param {Object} [data] - 附加数据
     */
    clusterEvent(eventType, message, data = null) {
        const timeString = this.getTimeString();
        const processType = this.isMaster ? '主进程' : '工作进程';
        
        if (data) {
            console.log(`[${timeString}] [${processType} ${this.pid}] [CLUSTER:${eventType}] ${message}`, data);
        } else {
            console.log(`[${timeString}] [${processType} ${this.pid}] [CLUSTER:${eventType}] ${message}`);
        }
    }
}

module.exports = new ClusterLogger(); 