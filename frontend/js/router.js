// 路由管理器 - 处理前端路由和页面切换
import { storage } from './utils.js';

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.init();
  }

  // 初始化路由
  init() {
    // 监听浏览器前进后退按钮
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });

    // 监听页面加载完成事件
    document.addEventListener('DOMContentLoaded', () => {
      this.navigate(window.location.pathname, false);
    });
  }

  // 添加路由
  addRoute(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  // 导航到指定路径
  navigate(path, pushState = true) {
    // 如果路径以.html结尾，去掉.html
    if (path.endsWith('.html')) {
      path = path.slice(0, -5);
    }

    // 如果路径为空，设置为首页
    if (path === '' || path === '/') {
      path = '/home';
    }

    // 保存当前路由
    this.currentRoute = path;

    // 更新浏览器历史记录
    if (pushState) {
      history.pushState(null, null, path + '.html');
    }

    // 执行路由处理函数
    if (this.routes[path]) {
      this.routes[path]();
    } else if (this.routes['/404']) {
      this.routes['/404']();
    } else {
      console.warn(`Route ${path} not found`);
    }

    // 触发路由变化事件
    window.dispatchEvent(new CustomEvent('routeChange', { detail: path }));
  }

  // 获取当前路由
  getCurrentRoute() {
    return this.currentRoute;
  }

  // 页面切换函数（用于手机端）
  switchPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // 显示目标页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // 更新移动端导航栏激活状态
    document.querySelectorAll('.mobile-nav .nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-page') === pageId) {
        item.classList.add('active');
      }
    });

    // 滚动到顶部
    window.scrollTo(0, 0);

    // 保存当前页面到本地存储
    storage.set('currentPage', pageId);
  }
}

// 创建并导出路由实例
const router = new Router();
export default router;