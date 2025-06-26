/**
 * 服务模块导出
 * 统一导出所有服务，便于在控制器中引用
 */

// 用户端服务
const UserAuthService = require('./user/UserAuthService');
const UserProfileService = require('./user/UserProfileService');

// 管理端服务
const AdminUserService = require('./admin/AdminUserService');
const AdminSystemService = require('./admin/AdminSystemService');

// 基础服务
const BaseService = require('./base/BaseService');

// 通用服务
const EmailService = require('./common/EmailService');
const FileService = require('./common/FileService');
const NotificationService = require('./common/NotificationService');

module.exports = {
  // 基础服务
  BaseService,
  
  // 用户端服务
  UserAuthService,
  UserProfileService,
  
  // 管理端服务
  AdminUserService,
  AdminSystemService,
  
  // 通用服务
  EmailService,
  FileService,
  NotificationService
};
