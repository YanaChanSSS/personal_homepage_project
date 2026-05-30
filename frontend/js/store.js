// 应用状态管理器 - 管理全局应用状态
import eventManager, { EVENTS } from './events.js';
import { storage } from './utils.js';

class Store {
  constructor() {
    // 初始化状态
    this.state = this.getInitialState();
    this.listeners = [];
    
    // 绑定方法
    this.setState = this.setState.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.getState = this.getState.bind(this);
    this.notifyListeners = this.notifyListeners.bind(this);
    
    // 从本地存储恢复状态
    this.restoreState();
    
    // 监听存储事件，处理跨标签页状态同步
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
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
        theme: storage.get('theme') || 'light',
        language: storage.get('language') || 'zh-CN'
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
    return this.state;
  }
  
  // 获取状态的某一部分
  get(path) {
    return this.getNestedProperty(this.state, path);
  }

  // 设置状态
  setState(newState, options = {}) {
    const { silent = false } = options;
    const prevState = { ...this.state };
    
    // 合并状态
    this.state = this.deepMerge(this.state, newState);
    
    // 保存到本地存储
    this.persistState();
    
    // 触发状态变化事件
    if (!silent) {
      eventManager.emit(EVENTS.APP_STATE_CHANGE, {
        state: this.getState(),
        changed: newState
      });
      
      // 通知监听器
      this.notifyListeners(prevState, this.state);
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

  /**
   * 更新UI状态
   * @param {Object} uiState - 要更新的UI状态
   * @returns {void}
   */
  setUI(uiState) {
    if (!uiState || typeof uiState !== 'object') {
      console.warn('setUI: 参数必须是一个对象');
      return;
    }
    
    try {
      this.setState({
        ui: {
          ...this.state.ui,
          ...uiState
        }
      });
      
      // 触发UI更新事件
      eventManager.emit(EVENTS.UI_UPDATE, { ...uiState });
    } catch (error) {
      console.error('更新UI状态失败:', error);
    }
  }

  /**
   * 更新应用状态
   * @param {Object} appState - 要更新的应用状态
   * @returns {void}
   */
  setApp(appState) {
    if (!appState || typeof appState !== 'object') {
      console.warn('setApp: 参数必须是一个对象');
      return;
    }
    
    try {
      this.setState({
        app: {
          ...this.state.app,
          ...appState
        }
      });
      
      // 如果主题或语言变更，保存到本地存储
      if (appState.theme || appState.language) {
        this.persistState();
      }
      
      // 触发应用状态更新事件
      eventManager.emit(EVENTS.APP_UPDATE, { ...appState });
    } catch (error) {
      console.error('更新应用状态失败:', error);
    }
  }

  /**
   * 更新缓存
   * @param {Object} cacheState - 要更新的缓存状态
   * @param {Object} [options={}] - 选项
   * @param {boolean} [options.persist=false] - 是否持久化到本地存储
   * @returns {void}
   */
  setCache(cacheState, { persist = false } = {}) {
    if (!cacheState || typeof cacheState !== 'object') {
      console.warn('setCache: 参数必须是一个对象');
      return;
    }
    
    try {
      this.setState({
        cache: {
          ...this.state.cache,
          ...cacheState
        }
      });
      
      // 如果需要持久化，保存到本地存储
      if (persist) {
        this.persistState();
      }
      
      // 触发缓存更新事件
      eventManager.emit(EVENTS.CACHE_UPDATE, { ...cacheState });
    } catch (error) {
      console.error('更新缓存失败:', error);
    }
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
    if (typeof listener !== 'function') {
      console.error('监听器必须是一个函数');
      return () => {};
    }
    
    this.listeners.push(listener);
    
    // 立即用当前状态调用一次监听器
    try {
      listener(this.state, this.state);
    } catch (error) {
      console.error('初始化状态监听器时出错:', error);
    }
    
    // 返回取消订阅函数
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // 通知所有监听器
  notifyListeners(prevState, nextState) {
    // 复制监听器数组，避免在迭代过程中被修改
    const listeners = this.listeners.slice();
    
    // 通知所有监听器
    listeners.forEach(listener => {
      try {
        listener(nextState, prevState);
      } catch (error) {
        console.error('状态监听器出错:', error);
      }
    });
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

  // 从本地存储恢复状态
  restoreState() {
    try {
      const savedState = storage.get('appState');
      if (savedState) {
        const prevState = { ...this.state };
        this.state = this.deepMerge(this.state, savedState);
        this.notifyListeners(prevState, this.state);
      }
    } catch (error) {
      console.warn('Failed to restore state from localStorage:', error);
    }
  }

  // 持久化状态到本地存储
  persistState() {
    try {
      storage.set('appState', this.state);
    } catch (error) {
      console.error('保存状态到本地存储失败:', error);
    }
  }

  // 处理跨标签页存储事件
  handleStorageEvent(event) {
    // 只处理appState的变化
    if (event.key === 'appState' && event.newValue) {
      try {
        const savedState = JSON.parse(event.newValue);
        if (savedState) {
          const prevState = { ...this.state };
          this.state = this.deepMerge(this.state, savedState);
          this.notifyListeners(prevState, this.state);
          eventManager.emit(EVENTS.APP_STATE_CHANGE, {
            state: this.getState(),
            changed: savedState
          });
        }
      } catch (error) {
        console.warn('Failed to handle storage event:', error);
      }
    }
  }

  // 重置状态
  reset() {
    const prevState = { ...this.state };
    this.state = this.getInitialState();
    storage.remove('appState');
    this.notifyListeners(prevState, this.state);
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