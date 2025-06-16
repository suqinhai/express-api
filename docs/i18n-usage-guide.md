# 国际化(i18n)使用指南

本项目已经集成了国际化(i18n)功能，可以轻松支持多语言。本指南将帮助你在新的路由或现有路由中使用国际化功能。

## 基础概念

- **翻译键**: 类似 `user.login.success` 格式的字符串，用于在翻译文件中查找对应的文本
- **翻译文件**: 位于 `express-api/locales/{语言代码}/translation.json` 的JSON文件，存储了所有翻译内容
- **默认语言**: 当没有找到对应的翻译时，系统会回退到中文(`zh`)

## 如何使用国际化

### 在响应中使用翻译键

最简单的方式是在发送响应时使用翻译键而非直接文本：

```javascript
// 使用翻译键
return res.sendSuccess('user.login.success', data);

// 错误响应也可以使用翻译键
return res.sendBadRequest('validation.required');
```

系统会自动根据用户设置的语言，将翻译键转换为对应的文本。

### 在路由处理程序中直接翻译

如果需要在路由处理程序中使用翻译结果，可以使用请求或响应对象的 `t()` 方法：

```javascript
// 在请求对象上翻译
const message = req.t('user.profile.welcome', { username: user.name });

// 或在响应对象上翻译
const errorMsg = res.t('validation.tooShort', { field: '密码', min: 8 });
```

### 添加新的翻译

1. 打开对应语言的翻译文件，例如 `express-api/locales/zh/translation.json` 和 `express-api/locales/en/translation.json`
2. 添加新的翻译键和对应的文本，保持JSON结构和层次一致
3. 建议使用点号分隔的命名方式，如 `模块.功能.状态`

示例：
```json
{
  "user": {
    "profile": {
      "welcome": "欢迎回来，{{username}}",
      "lastLogin": "上次登录时间: {{time}}"
    }
  }
}
```

### 客户端语言设置

系统会按以下优先级检测用户语言：

1. URL查询参数: `?lang=en`
2. HTTP请求头: `Accept-Language`
3. Cookie: `i18next=en`

如果客户端需要切换语言，最简单的方法是添加 `?lang=语言代码` 查询参数。

## 最佳实践

1. **使用有意义的翻译键**: 让翻译键反映其用途，如 `user.login.success` 而不是 `login_ok`
2. **保持层次结构**: 使用点号分隔的多级结构，便于组织和查找
3. **参数化文本**: 对于含有变量的文本，使用 `{{变量名}}` 形式的参数
4. **直接使用响应方法**: 大多数情况下，使用 `res.sendSuccess()` 和 `res.sendError()` 等方法并传入翻译键即可
5. **避免硬编码**: 不要在代码中直接使用特定语言的文本，应该全部使用翻译键

## 注意事项

- 翻译键如果找不到对应的翻译，会显示键本身，所以确保添加了所有语言的对应翻译
- 更新翻译文件后不需要重启服务器，i18next会自动检测文件变化
- 对于复杂的翻译需求，可以使用嵌套对象、数组等高级功能，参考 i18next 文档

希望这个指南能帮助你更好地使用国际化功能！如有任何问题，请参考 [i18next官方文档](https://www.i18next.com/)。 