/**
 * 语言中间件
 * 处理语言偏好的检测和设置
 */

const { getI18n } = require('../../common/i18n');

/**
 * 语言变更中间件
 * 允许通过API更改语言设置
 */
const languageMiddleware = (req, res, next) => {
  // 添加语言辅助方法到请求对象
  req.changeLanguage = async (lng) => {
    try {
      await req.i18n.changeLanguage(lng);
      // 如果请求中存在cookies方法，则设置语言cookie
      if (req.cookies) {
        res.cookie('i18next', lng, {
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1年
          httpOnly: false, // 允许客户端JavaScript访问
          path: '/'
        });
      }
      return true;
    } catch (err) {
      console.error('Failed to change language:', err);
      return false;
    }
  };

  // 添加翻译辅助方法到请求对象
  req.t = (key, options) => {
    return req.i18n.t(key, options);
  };

  // 添加当前语言辅助方法到请求对象
  req.getCurrentLanguage = () => {
    return req.language || 'zh'; // 默认为中文
  };

  // 添加获取支持的语言方法
  req.getSupportedLanguages = () => {
    return getI18n().options.supportedLngs;
  };

  next();
};

/**
 * 验证语言是否被支持
 * @param {String} lang - 要验证的语言代码
 * @returns {Boolean} - 是否支持该语言
 */
const isLanguageSupported = (lang) => {
  const i18n = getI18n();
  const supportedLangs = i18n.options.supportedLngs;
  return supportedLangs.includes(lang);
};

module.exports = {
  languageMiddleware,
  isLanguageSupported
}; 