// 国际化管理器 - 处理多语言支持
import { storage } from './utils.js';

class I18n {
  constructor() {
    // 默认语言
    this.defaultLanguage = 'zh-CN';
    
    // 支持的语言列表
    this.supportedLanguages = ['zh-CN', 'en'];
    
    // 当前语言
    this.currentLanguage = this.detectLanguage();
    
    // 翻译资源
    this.translations = {
      'zh-CN': {
        // 导航
        'nav.home': '首页',
        'nav.search': '搜索',
        'nav.favorites': '收藏',
        'nav.about': '关于',
        'nav.login': '登录',
        'nav.logout': '退出登录',
        
        // 页面标题
        'page.home.title': 'YanaChan可爱捏',
        'page.login.title': '登录',
        'page.register.title': '注册',
        'page.profile.title': '用户信息',
        
        // 表单标签
        'form.username': '用户名',
        'form.email': '邮箱',
        'form.password': '密码',
        'form.confirmPassword': '确认密码',
        'form.emailCode': '邮箱验证码',
        'form.bio': '个人简介',
        'form.message': '想对开发者说的话',
        
        // 按钮
        'button.login': '登录',
        'button.register': '注册',
        'button.save': '保存信息',
        'button.logout': '退出登录',
        'button.sendCode': '发送验证码',
        'button.reply': '回复',
        
        // 提示信息
        'message.loginSuccess': '登录成功！',
        'message.registerSuccess': '注册成功！即将跳转到登录页...',
        'message.saveSuccess': '信息保存成功！',
        'message.logoutSuccess': '退出登录成功',
        'message.codeSent': '验证码已发送，请查收邮箱',
        'message.replySuccess': '回复成功',
        
        // 错误信息
        'error.network': '网络错误，请稍后重试',
        'error.loginFailed': '登录失败',
        'error.registerFailed': '注册失败',
        'error.invalidCredentials': '用户名或密码错误',
        'error.usernameRequired': '请输入用户名',
        'error.passwordRequired': '请输入密码',
        'error.emailRequired': '请输入邮箱地址',
        'error.invalidEmail': '请输入有效的邮箱地址',
        'error.codeRequired': '请输入验证码',
        'error.passwordMismatch': '两次输入的密码不一致',
        'error.passwordWeak': '密码强度不足',
        
        // 密码要求
        'password.requirement.length': '至少8位字符',
        'password.requirement.uppercase': '包含大写字母',
        'password.requirement.lowercase': '包含小写字母',
        'password.requirement.number': '包含数字',
        'password.requirement.special': '包含特殊字符',
        'password.strength.weak': '弱',
        'password.strength.medium': '中等',
        'password.strength.strong': '强',
        
        // 其他
        'text.welcome': '欢迎来到我的个人主页！这里展示我喜欢的一切，包括我的作品与收藏。',
        'text.about': '我是一名在校软件工程大学生，正在学习各类技术。我热爱学习新技术，喜欢分享知识。业余时间喜欢看动画和学习吉他。',
        'text.contact': '如果您有任何合作机会或问题，欢迎通过以下方式联系我：',
        'text.copyright': 'YanaChan 版权所有。'
      },
      
      'en': {
        // Navigation
        'nav.home': 'Home',
        'nav.search': 'Search',
        'nav.favorites': 'Favorites',
        'nav.about': 'About',
        'nav.login': 'Login',
        'nav.logout': 'Logout',
        
        // Page titles
        'page.home.title': 'YanaChan Cute',
        'page.login.title': 'Login',
        'page.register.title': 'Register',
        'page.profile.title': 'User Profile',
        
        // Form labels
        'form.username': 'Username',
        'form.email': 'Email',
        'form.password': 'Password',
        'form.confirmPassword': 'Confirm Password',
        'form.emailCode': 'Email Code',
        'form.bio': 'Bio',
        'form.message': 'Message to Developer',
        
        // Buttons
        'button.login': 'Login',
        'button.register': 'Register',
        'button.save': 'Save Information',
        'button.logout': 'Logout',
        'button.sendCode': 'Send Code',
        'button.reply': 'Reply',
        
        // Messages
        'message.loginSuccess': 'Login successful!',
        'message.registerSuccess': 'Registration successful! Redirecting to login page...',
        'message.saveSuccess': 'Information saved successfully!',
        'message.logoutSuccess': 'Logout successful',
        'message.codeSent': 'Verification code sent, please check your email',
        'message.replySuccess': 'Reply sent successfully',
        
        // Errors
        'error.network': 'Network error, please try again later',
        'error.loginFailed': 'Login failed',
        'error.registerFailed': 'Registration failed',
        'error.invalidCredentials': 'Invalid username or password',
        'error.usernameRequired': 'Please enter username',
        'error.passwordRequired': 'Please enter password',
        'error.emailRequired': 'Please enter email address',
        'error.invalidEmail': 'Please enter a valid email address',
        'error.codeRequired': 'Please enter verification code',
        'error.passwordMismatch': 'Passwords do not match',
        'error.passwordWeak': 'Password is too weak',
        
        // Password requirements
        'password.requirement.length': 'At least 8 characters',
        'password.requirement.uppercase': 'Contains uppercase letter',
        'password.requirement.lowercase': 'Contains lowercase letter',
        'password.requirement.number': 'Contains number',
        'password.requirement.special': 'Contains special character',
        'password.strength.weak': 'Weak',
        'password.strength.medium': 'Medium',
        'password.strength.strong': 'Strong',
        
        // Other
        'text.welcome': 'Welcome to my personal homepage! Here I showcase everything I love, including my projects and collections.',
        'text.about': 'I am a software engineering student learning various technologies. I love learning new technologies and sharing knowledge. In my spare time, I enjoy watching anime and learning guitar.',
        'text.contact': 'If you have any collaboration opportunities or questions, feel free to contact me through the following methods:',
        'text.copyright': 'YanaChan All Rights Reserved.'
      }
    };
  }

  // 检测用户语言
  detectLanguage() {
    // 首先检查本地存储
    const savedLanguage = storage.get('language');
    if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
      return savedLanguage;
    }
    
    // 检查浏览器语言
    const browserLanguage = navigator.language || navigator.userLanguage;
    if (this.supportedLanguages.includes(browserLanguage)) {
      return browserLanguage;
    }
    
    // 检查浏览器支持的语言列表
    const browserLanguages = navigator.languages || [];
    for (const lang of browserLanguages) {
      if (this.supportedLanguages.includes(lang)) {
        return lang;
      }
    }
    
    // 返回默认语言
    return this.defaultLanguage;
  }

  // 切换语言
  setLanguage(language) {
    if (this.supportedLanguages.includes(language)) {
      this.currentLanguage = language;
      storage.set('language', language);
      
      // 触发语言变化事件
      window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
      
      return true;
    }
    
    return false;
  }

  // 获取当前语言
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // 获取支持的语言列表
  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  // 翻译文本
  t(key, params = {}) {
    // 获取当前语言的翻译
    const translations = this.translations[this.currentLanguage] || 
                        this.translations[this.defaultLanguage];
    
    // 查找翻译文本
    let text = translations[key] || key;
    
    // 替换参数
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${param}}`, 'g'), value);
    }
    
    return text;
  }

  // 翻译HTML元素
  translateElement(element) {
    const key = element.getAttribute('data-i18n');
    if (key) {
      element.textContent = this.t(key);
    }
  }

  // 翻译整个页面
  translatePage() {
    // 翻译所有带data-i18n属性的元素
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => this.translateElement(element));
    
    // 翻译placeholder属性
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });
    
    // 翻译title属性
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });
  }

  // 格式化日期
  formatDate(date, options = {}) {
    return new Date(date).toLocaleDateString(this.currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    });
  }

  // 格式化时间
  formatTime(date, options = {}) {
    return new Date(date).toLocaleTimeString(this.currentLanguage, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    });
  }

  // 格式化数字
  formatNumber(number, options = {}) {
    return number.toLocaleString(this.currentLanguage, options);
  }
}

// 创建并导出国际化管理器实例
const i18n = new I18n();

// 页面加载完成后自动翻译
document.addEventListener('DOMContentLoaded', () => {
  i18n.translatePage();
});

// 监听语言变化事件
window.addEventListener('languageChange', () => {
  i18n.translatePage();
});

export default i18n;
export { I18n };