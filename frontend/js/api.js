// API客户端 - 统一处理所有API请求
import { storage, cookies } from './utils.js';

class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  // 设置认证令牌
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  // 获取认证令牌
  getAuthToken() {
    return cookies.get('authToken') || storage.get('authToken');
  }

  // 构建完整URL
  buildURL(endpoint) {
    // 如果是完整URL，直接返回
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    
    // 如果以/开头，拼接到baseURL后
    if (endpoint.startsWith('/')) {
      return this.baseURL + endpoint;
    }
    
    // 否则添加/
    return `${this.baseURL}/${endpoint}`;
  }

  // 发送请求
  async request(endpoint, options = {}) {
    const url = this.buildURL(endpoint);
    
    // 合并默认headers和传入的headers
    const headers = {
      ...this.defaultHeaders,
      ...options.headers
    };
    
    // 构建fetch选项
    const fetchOptions = {
      ...options,
      headers
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // 检查响应状态
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // 如果解析JSON失败，使用文本内容
          try {
            const text = await response.text();
            errorData = { message: text || `HTTP ${response.status}: ${response.statusText}` };
          } catch (e2) {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
        }
        
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      // 如果响应体为空，返回null
      if (response.status === 204) {
        return null;
      }
      
      // 尝试解析JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      // 返回文本内容
      return await response.text();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // 网络错误
      throw new ApiError(
        error.message || '网络请求失败，请检查网络连接',
        0,
        { originalError: error }
      );
    }
  }

  // GET请求
  async get(endpoint, params = null, options = {}) {
    let url = endpoint;
    
    // 添加查询参数
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += (url.includes('?') ? '&' : '?') + searchParams.toString();
    }
    
    return this.request(url, {
      ...options,
      method: 'GET'
    });
  }

  // POST请求
  async post(endpoint, data = null, options = {}) {
    const requestOptions = {
      ...options,
      method: 'POST'
    };
    
    if (data instanceof FormData) {
      // FormData不需要设置Content-Type，浏览器会自动设置
      delete requestOptions.headers?.['Content-Type'];
      requestOptions.body = data;
    } else if (data !== null) {
      requestOptions.body = JSON.stringify(data);
    }
    
    return this.request(endpoint, requestOptions);
  }

  // PUT请求
  async put(endpoint, data = null, options = {}) {
    const requestOptions = {
      ...options,
      method: 'PUT'
    };
    
    if (data instanceof FormData) {
      delete requestOptions.headers?.['Content-Type'];
      requestOptions.body = data;
    } else if (data !== null) {
      requestOptions.body = JSON.stringify(data);
    }
    
    return this.request(endpoint, requestOptions);
  }

  // DELETE请求
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }

  // 登录
  async login(credentials) {
    const response = await this.post('/login', credentials);
    
    // 保存认证令牌
    if (response.token) {
      cookies.set('authToken', response.token, 7); // 保存7天
      storage.set('authToken', response.token);
      this.setAuthToken(response.token);
    }
    
    return response;
  }

  // 注册
  async register(userData) {
    return await this.post('/register', userData);
  }

  // 登出
  async logout() {
    try {
      await this.post('/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
    
    // 清除认证信息
    cookies.remove('authToken');
    storage.remove('authToken');
    this.setAuthToken(null);
  }

  // 检查登录状态
  async checkLoginStatus() {
    const token = this.getAuthToken();
    if (!token) {
      return { logged_in: false };
    }
    
    this.setAuthToken(token);
    
    try {
      return await this.get('/api/check_login');
    } catch (error) {
      // 如果是认证错误，清除认证信息
      if (error.status === 401) {
        cookies.remove('authToken');
        storage.remove('authToken');
        this.setAuthToken(null);
      }
      
      throw error;
    }
  }

  // 获取用户信息
  async getUserInfo() {
    return await this.get('/api/user_info');
  }

  // 更新用户信息
  async updateUserInfo(userData) {
    return await this.post('/profile', userData);
  }

  // 获取留言
  async getMessages() {
    return await this.get('/api/messages');
  }

  // 发送留言
  async sendMessage(content) {
    return await this.post('/api/messages', { content });
  }

  // 回复留言
  async replyToMessage(messageId, content) {
    return await this.post(`/api/messages/${messageId}/reply`, { content });
  }
}

// 自定义API错误类
class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// 创建并导出API客户端实例
const apiClient = new ApiClient();
export default apiClient;
export { ApiError };