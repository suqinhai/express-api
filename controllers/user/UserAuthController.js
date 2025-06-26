/**
 * 用户认证控制器
 * 处理用户端认证相关的HTTP请求
 */

const BaseController = require('../base/BaseController');
const UserAuthService = require('../../services/user/UserAuthService');

class UserAuthController extends BaseController {
  constructor() {
    super();
    this.userAuthService = new UserAuthService();
  }

  /**
   * 用户登录
   * POST /api/user/auth/login
   */
  login = this.asyncHandler(async (req, res) => {
    try {
      this.logAction('用户登录请求', req);

      const { username, password } = req.body;

      // 验证必需参数
      const validationErrors = this.validateRequiredFields(req, ['username', 'password']);
      if (validationErrors) {
        return this.sendError(res, '请求参数不完整', 400, validationErrors);
      }

      // 调用服务层处理登录
      const result = await this.userAuthService.login(username, password, res.sequelize);

      // 返回成功响应
      return this.sendSuccess(res, '登录成功', {
        user: result.user,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn
      });

    } catch (error) {
      this.logError('用户登录失败', error, req);
      
      // 根据错误类型返回不同的状态码
      if (error.message.includes('用户不存在') || error.message.includes('密码错误')) {
        return this.sendError(res, '用户名或密码错误', 401);
      } else if (error.message.includes('状态异常')) {
        return this.sendError(res, '账户状态异常，请联系管理员', 403);
      } else if (error.message.includes('验证失败')) {
        return this.sendError(res, error.message, 400);
      } else {
        return this.sendError(res, '登录失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 用户注册
   * POST /api/user/auth/register
   */
  register = this.asyncHandler(async (req, res) => {
    try {
      this.logAction('用户注册请求', req);

      const { username, email, password, confirmPassword } = req.body;

      // 验证必需参数
      const validationErrors = this.validateRequiredFields(req, ['username', 'email', 'password', 'confirmPassword']);
      if (validationErrors) {
        return this.sendError(res, '请求参数不完整', 400, validationErrors);
      }

      // 验证密码确认
      if (password !== confirmPassword) {
        return this.sendError(res, '两次输入的密码不一致', 400);
      }

      // 调用服务层处理注册
      const result = await this.userAuthService.register({
        username,
        email,
        password
      }, res.sequelize);

      // 返回成功响应
      return this.sendSuccess(res, '注册成功', {
        user: result.user,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn
      }, 201);

    } catch (error) {
      this.logError('用户注册失败', error, req);
      
      // 根据错误类型返回不同的状态码
      if (error.message.includes('已存在') || error.message.includes('已被注册')) {
        return this.sendError(res, error.message, 409);
      } else if (error.message.includes('验证失败')) {
        return this.sendError(res, error.message, 400);
      } else {
        return this.sendError(res, '注册失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 刷新令牌
   * POST /api/user/auth/refresh
   */
  refreshToken = this.asyncHandler(async (req, res) => {
    try {
      this.logAction('令牌刷新请求', req);

      const { refreshToken } = req.body;

      // 验证必需参数
      if (!refreshToken) {
        return this.sendError(res, '刷新令牌不能为空', 400);
      }

      // 调用服务层处理令牌刷新
      const tokens = await this.userAuthService.refreshToken(refreshToken, res.sequelize);

      // 返回成功响应
      return this.sendSuccess(res, '令牌刷新成功', {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      });

    } catch (error) {
      this.logError('令牌刷新失败', error, req);
      
      if (error.message.includes('无效') || error.message.includes('过期')) {
        return this.sendError(res, '刷新令牌无效或已过期', 401);
      } else {
        return this.sendError(res, '令牌刷新失败', 500);
      }
    }
  });

  /**
   * 用户登出
   * POST /api/user/auth/logout
   */
  logout = this.asyncHandler(async (req, res) => {
    try {
      this.logAction('用户登出请求', req, { userId: req.user?.id });

      // 获取当前用户的令牌
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return this.sendError(res, '未找到访问令牌', 400);
      }

      // 调用服务层处理登出
      await this.userAuthService.logout(token);

      // 返回成功响应
      return this.sendSuccess(res, '登出成功');

    } catch (error) {
      this.logError('用户登出失败', error, req);
      return this.sendError(res, '登出失败', 500);
    }
  });

  /**
   * 获取当前用户信息
   * GET /api/user/auth/me
   */
  getCurrentUser = this.asyncHandler(async (req, res) => {
    try {
      this.logAction('获取当前用户信息', req, { userId: req.user?.id });

      // 检查用户是否已认证
      if (!req.user) {
        return this.sendError(res, '用户未认证', 401);
      }

      // 返回当前用户信息（已经在中间件中处理了敏感信息）
      return this.sendSuccess(res, '获取用户信息成功', {
        user: req.user
      });

    } catch (error) {
      this.logError('获取当前用户信息失败', error, req);
      return this.sendError(res, '获取用户信息失败', 500);
    }
  });

  /**
   * 修改密码
   * PUT /api/user/auth/password
   */
  changePassword = this.asyncHandler(async (req, res) => {
    try {
      this.logAction('修改密码请求', req, { userId: req.user?.id });

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // 验证必需参数
      const validationErrors = this.validateRequiredFields(req, ['currentPassword', 'newPassword', 'confirmPassword']);
      if (validationErrors) {
        return this.sendError(res, '请求参数不完整', 400, validationErrors);
      }

      // 验证新密码确认
      if (newPassword !== confirmPassword) {
        return this.sendError(res, '两次输入的新密码不一致', 400);
      }

      // 检查用户是否已认证
      if (!req.user) {
        return this.sendError(res, '用户未认证', 401);
      }

      // 调用服务层处理密码修改
      await this.userAuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
        res.sequelize
      );

      // 返回成功响应
      return this.sendSuccess(res, '密码修改成功');

    } catch (error) {
      this.logError('修改密码失败', error, req);
      
      if (error.message.includes('当前密码错误')) {
        return this.sendError(res, '当前密码错误', 400);
      } else if (error.message.includes('验证失败')) {
        return this.sendError(res, error.message, 400);
      } else {
        return this.sendError(res, '密码修改失败', 500);
      }
    }
  });

  /**
   * 验证令牌有效性
   * GET /api/user/auth/verify
   */
  verifyToken = this.asyncHandler(async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return this.sendError(res, '未提供访问令牌', 400);
      }

      // 调用服务层验证令牌
      const decoded = await this.userAuthService.verifyToken(token);

      return this.sendSuccess(res, '令牌有效', {
        valid: true,
        user: {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email
        },
        expiresAt: new Date(decoded.exp * 1000)
      });

    } catch (error) {
      this.logError('令牌验证失败', error, req);
      return this.sendError(res, '令牌无效或已过期', 401);
    }
  });
}

module.exports = UserAuthController;
