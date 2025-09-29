// 应用状态管理器 - 管理全局应用状态
import eventManager, { EVENTS } from './events.js';
import { storage } from './utils.js';

class Store {
  constructor() {
    // 初始化状态
    this.state = this.getInitialState();
    
    // 监听状态变化
    this.listeners = [];
    
    // 从本地存储恢复状态
    this.restoreState();
  }

  // 获取初始状态
  getInitialState() {
    return {
      // 用户状态
      user: {
        isLoggedIn: false,
        profile: null,
        permissions: []
      },
      
      // 应用状态
      app: {
        loading: false,
        online: navigator.onLine,
        theme: 'light', // light, dark
        language: 'zh-CN'
      },
      
      // UI状态
      ui: {
        sidebarOpen: false,
        modalOpen: false,
        currentPage: 'home',
        notifications: []
      },
      
      // 数据缓存
      cache: {
        messages: null,
        projects: null
      }
    };
  }

  // 获取当前状态
  getState() {
    return { ...this.state };
  }

  // 获取状态的某一部分
  get(path) {
    return this.getNestedProperty(this.state, path);
  }

  // 设置状态
  setState(newState, options = {}) {
    const { silent = false } = options;
    
    // 合并状态
    this.state = this.deepMerge(this.state, newState);
    
    // 保存到本地存储
    this.saveState();
    
    // 触发状态变化事件
    if (!silent) {
      eventManager.emit(EVENTS.APP_STATE_CHANGE, {
        state: this.getState(),
        changed: newState
      });
      
      // 通知监听器
      this.listeners.forEach(listener => {
        try {
          listener(this.state, newState);
        } catch (error) {
          console.error('Error in state listener:', error);
        }
      });
    }
  }

  // 更新用户状态
  setUser(user) {
    this.setState({
      user: {
        isLoggedIn: true,
        profile: user,
        permissions: user.permissions || []
      }
    });
    
    eventManager.emit(EVENTS.USER_LOGIN, { user });
  }

  // 清除用户状态（登出）
  clearUser() {
    this.setState({
      user: {
        isLoggedIn: false,
        profile: null,
        permissions: []
      }
    });
    
    eventManager.emit(EVENTS.USER_LOGOUT);
  }

  // 更新UI状态
  setUI(uiState) {
    this.setState({
      ui: {
        ...this.state.ui,
        ...uiState
      }
    });
  }

  // 更新应用状态
  setApp(appState) {
    this.setState({
      app: {
        ...this.state.app,
        ...appState
      }
    });
  }

  // 更新缓存
  setCache(cacheState) {
    this.setState({
      cache: {
        ...this.state.cache,
        ...cacheState
      }
    });
  }

  // 添加通知
  addNotification(notification) {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...notification
    };
    
    this.setState({
      ui: {
        ...this.state.ui,
        notifications: [...this.state.ui.notifications, newNotification]
      }
    });
    
    eventManager.emit(EVENTS.NOTIFICATION_SHOW, newNotification);
  }

  // 移除通知
  removeNotification(id) {
    this.setState({
      ui: {
        ...this.state.ui,
        notifications: this.state.ui.notifications.filter(n => n.id !== id)
      }
    });
  }

  // 清除所有通知
  clearNotifications() {
    this.setState({
      ui: {
        ...this.state.ui,
        notifications: []
      }
    });
  }

  // 订阅状态变化
  subscribe(listener) {
    this.listeners.push(listener);
    
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 深度合并对象
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  // 获取嵌套属性
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // 保存状态到本地存储
  saveState() {
    try {
      const stateToSave = {
        user: this.state.user,
        app: this.state.app,
        ui: {
          ...this.state.ui,
          notifications: [] // 不保存通知
        }
      };
      
      storage.set('appState', stateToSave);
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }

  // 从本地存储恢复状态
  restoreState() {
    try {
      const savedState = storage.get('appState');
      if (savedState) {
        this.state = this.deepMerge(this.state, savedState);
      }
    } catch (error) {
      console.warn('Failed to restore state from localStorage:', error);
    }
  }

  // 重置状态
  reset() {
    this.state = this.getInitialState();
    storage.remove('appState');
    eventManager.emit(EVENTS.APP_STATE_RESET);
  }
}

// 创建并导出状态管理器实例
const store = new Store();

// 监听网络状态变化
window.addEventListener('online', () => {
  store.setApp({ online: true });
  eventManager.emit(EVENTS.NETWORK_ONLINE);
});

window.addEventListener('offline', () => {
  store.setApp({ online: false });
  eventManager.emit(EVENTS.NETWORK_OFFLINE);
});

export default store;
export { Store };