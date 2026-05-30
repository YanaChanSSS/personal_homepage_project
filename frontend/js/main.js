// 主应用程序入口文件
import { storage, cookies } from './utils.js';
import { checkAuth } from './auth.js';
import store from './store.js';

class App {
  constructor() {
    this.isServiceWorkerSupported = 'serviceWorker' in navigator;
    this.isOnline = navigator.onLine;
    this.init();
  }

  // 初始化应用
  async init() {
    try {
      // 先设置UI初始状态
      this.updateAuthUI({
        isLoggedIn: false,
        profile: null,
        permissions: []
      });

      // 初始化服务
      this.setupServiceWorker();
      this.setupOnlineStatus();
      this.setupBeforeInstallPrompt();
      this.setupGlobalErrorHandling();
      this.setupPerformanceMonitoring();
      this.setupInstallPrompt();
      
      // 设置状态变化监听
      this.setupAuthListeners();
      
      // 最后检查登录状态
      await this.initializeAuth();
    } catch (error) {
      console.error('应用初始化失败:', error);
    }
  }
  
  // 初始化认证状态
  async initializeAuth() {
    try {
      const isAuthenticated = await checkAuth();
      console.log('认证状态:', isAuthenticated ? '已登录' : '未登录');
      
      // 确保UI状态正确
      const userState = store.getState().user;
      this.updateAuthUI(userState);
      
      return isAuthenticated;
    } catch (error) {
      console.error('初始化认证失败:', error);
      this.updateAuthUI({
        isLoggedIn: false,
        profile: null,
        permissions: []
      });
      return false;
    }
  }
  
  // 设置认证状态变化监听
  setupAuthListeners() {
    // 监听store中的用户状态变化
    store.subscribe((state) => {
      // 确保状态变化时更新UI
      this.updateAuthUI(state.user);
    });
  }
  
  // 更新认证相关的UI
  updateAuthUI(user) {
    const loginTrigger = document.getElementById('login-trigger');
    const userProfile = document.getElementById('user-profile');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    // 确保元素存在
    if (!loginTrigger || !userProfile) {
        console.warn('未找到登录相关UI元素，将在DOM加载完成后重试');
        // 如果DOM未完全加载，延迟重试
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => this.updateAuthUI(user));
        } else {
            // DOM已加载完成，但仍找不到元素，延迟执行
            setTimeout(() => this.updateAuthUI(user), 100);
        }
        return;
    }
    
    if (user && user.isLoggedIn) {
        // 用户已登录
        loginTrigger.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // 更新用户信息
        if (userName && user.profile && user.profile.username) {
            userName.textContent = user.profile.username;
        }
        
        // 更新头像
        if (userAvatar) {
            const avatarUrl = user.profile && user.profile.avatar ? 
                user.profile.avatar : 
                '/frontend/png/YanaChan.png';
            userAvatar.src = avatarUrl;
            userAvatar.alt = user.profile && user.profile.username ? 
                user.profile.username + '的头像' : 
                '用户头像';
        }
    } else {
        // 用户未登录
        loginTrigger.style.display = 'block';
        userProfile.style.display = 'none';
    }
  }

  // 设置Service Worker
  setupServiceWorker() {
    if (this.isServiceWorkerSupported) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
            
            // 检查更新
            registration.update();
            
            // 监听更新
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 新版本可用
                  this.showUpdateNotification();
                }
              });
            });
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }

  // 设置在线状态监听
  setupOnlineStatus() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNotification('已连接到网络', 'success');
      document.body.classList.remove('offline');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNotification('网络连接已断开，您仍可以浏览已缓存的内容', 'warning');
      document.body.classList.add('offline');
    });
  }

  // 设置安装提示
  setupBeforeInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // 阻止默认安装提示
      e.preventDefault();
      
      // 保存事件以便稍后触发
      this.deferredPrompt = e;
      
      // 显示自定义安装按钮
      this.showInstallButton();
    });
  }

  // 显示安装按钮
  showInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        this.promptInstall();
      });
    }
  }

  // 触发安装提示
  async promptInstall() {
    if (!this.deferredPrompt) return;
    
    // 显示安装提示
    this.deferredPrompt.prompt();
    
    // 等待用户响应
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // 清除保存的事件
    this.deferredPrompt = null;
  }

  // 设置全局错误处理
  setupGlobalErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      // 可以发送错误报告到服务器
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      // 可以发送错误报告到服务器
    });
  }

  // 设置性能监控
  setupPerformanceMonitoring() {
    // 监控页面加载性能
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            // 可以发送性能数据到分析服务
          }
        }, 0);
      });
    }
  }

  // 设置添加到主屏幕功能
  setupInstallPrompt() {
    const installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.textContent = '安装应用';
    installButton.className = 'install-button';
    installButton.style.display = 'none';
    
    document.body.appendChild(installButton);
  }

  // 显示更新通知
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <p>发现新版本可用</p>
      <button id="refresh-button">刷新以更新</button>
    `;
    
    document.body.appendChild(notification);
    
    document.getElementById('refresh-button').addEventListener('click', () => {
      window.location.reload();
    });
  }

  // 显示通知
  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `app-notification ${type}`;
    notification.textContent = message;
    
    // 添加样式
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '4px',
      color: 'white',
      zIndex: '10000',
      fontSize: '14px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease-out'
    });
    
    // 设置背景色
    switch(type) {
      case 'success':
        notification.style.backgroundColor = '#4caf50';
        break;
      case 'warning':
        notification.style.backgroundColor = '#ff9800';
        break;
      case 'error':
        notification.style.backgroundColor = '#f44336';
        break;
      default:
        notification.style.backgroundColor = '#2196f3';
    }
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动移除
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// 导出App类
export default App;