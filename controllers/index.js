/**
 * 控制器模块导出
 * 统一导出所有控制器，便于在路由中引用
 */

// 用户端控制器
const UserAuthController = require('./user/UserAuthController');
const UserProfileController = require('./user/UserProfileController');

// 管理端控制器
const AdminUserController = require('./admin/AdminUserController');
const AdminSystemController = require('./admin/AdminSystemController');

// 基础控制器
const BaseController = require('./base/BaseController');

module.exports = {
  // 基础控制器
  BaseController,
  
  // 用户端控制器
  UserAuthController,
  UserProfileController,
  
  // 管理端控制器
  AdminUserController,
  AdminSystemController
};
