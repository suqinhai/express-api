/**
 * 服务层模块统一导出文件
 * 功能：集中管理和导出所有服务类，便于在控制器和其他模块中统一引用
 * 架构：采用分层导出，区分基础、用户端、管理端和通用服务
 * 职责：服务层负责处理具体的业务逻辑，数据验证，数据库操作等
 */

// 引入用户端服务：处理面向普通用户的业务逻辑
const UserAuthService = require('./user/UserAuthService');         // 用户认证服务
const UserProfileService = require('./user/UserProfileService');   // 用户资料服务

// 引入管理端服务：处理面向管理员的业务逻辑
const AdminUserService = require('./admin/AdminUserService');       // 管理端用户管理服务
const AdminSystemService = require('./admin/AdminSystemService');   // 管理端系统管理服务

// 引入基础服务：提供通用的服务基类和公共方法
const BaseService = require('./base/BaseService');

// 引入通用服务：提供跨模块的公共功能
const EmailService = require('./common/EmailService');             // 邮件发送服务
const FileService = require('./common/FileService');               // 文件处理服务
const NotificationService = require('./common/NotificationService'); // 通知推送服务

// 导出所有服务，使用对象结构便于按需引入
module.exports = {
  // 基础服务：提供通用功能和继承基类
  BaseService,

  // 用户端服务：处理用户相关的业务逻辑
  UserAuthService,      // 用户认证：登录验证、令牌管理、密码处理
  UserProfileService,   // 用户资料：个人信息管理、头像处理、数据验证

  // 管理端服务：处理管理员相关的业务逻辑
  AdminUserService,     // 用户管理：用户CRUD、状态管理、权限分配
  AdminSystemService,   // 系统管理：系统监控、配置管理、日志处理

  // 通用服务：提供跨模块的公共功能
  EmailService,         // 邮件服务：发送验证邮件、通知邮件、模板渲染
  FileService,          // 文件服务：文件上传、存储、压缩、格式转换
  NotificationService   // 通知服务：消息推送、短信发送、站内通知
};
