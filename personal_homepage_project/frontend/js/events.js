// 事件管理系统 - 统一管理应用事件
class EventManager {
  constructor() {
    this.events = {};
  }

  // 订阅事件
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback);
    
    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  // 取消订阅
  off(event, callback) {
    if (!this.events[event]) return;
    
    const index = this.events[event].indexOf(callback);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
  }

  // 触发事件
  emit(event, data) {
    if (!this.events[event]) return;
    
    // 创建事件数据副本，防止修改原始数据
    const eventData = {
      ...data,
      timestamp: Date.now(),
      type: event
    };
    
    // 执行所有回调函数
    this.events[event].forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  // 一次性订阅事件
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
    
    return unsubscribe;
  }

  // 订阅多个事件
  onMultiple(events, callback) {
    const unsubscribes = events.map(event => this.on(event, callback));
    
    // 返回批量取消订阅函数
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }

  // 清除所有事件监听器
  clearAll() {
    this.events = {};
  }

  // 清除特定事件的所有监听器
  clearEvent(event) {
    if (this.events[event]) {
      delete this.events[event];
    }
  }

  // 获取事件监听器数量
  listenerCount(event) {
    if (!this.events[event]) return 0;
    return this.events[event].length;
  }
}

// 创建并导出事件管理器实例
const eventManager = new EventManager();

// 导出常用事件常量
const EVENTS = {
  // 用户相关事件
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_REGISTER: 'user:register',
  USER_PROFILE_UPDATE: 'user:profile:update',
  
  // 路由相关事件
  ROUTE_CHANGE: 'route:change',
  PAGE_LOADED: 'page:loaded',
  
  // 表单相关事件
  FORM_SUBMIT: 'form:submit',
  FORM_VALIDATE: 'form:validate',
  
  // 网络相关事件
  NETWORK_ONLINE: 'network:online',
  NETWORK_OFFLINE: 'network:offline',
  API_REQUEST: 'api:request',
  API_RESPONSE: 'api:response',
  API_ERROR: 'api:error',
  
  // UI相关事件
  NOTIFICATION_SHOW: 'notification:show',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  LOADING_START: 'loading:start',
  LOADING_END: 'loading:end',
  
  // 应用状态事件
  APP_INIT: 'app:init',
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error'
};

export default eventManager;
export { EventManager, EVENTS };