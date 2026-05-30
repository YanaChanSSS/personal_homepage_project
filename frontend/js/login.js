/**
 * 登录模块
 * 负责处理用户登录相关的功能
 */

import { showMessage, fetchPostForm } from './utils.js';
import store from './store.js';
import { checkAuth } from './auth.js';

class LoginModule {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('loginUsername');
        this.passwordInput = document.getElementById('loginPassword');
        this.submitButton = this.form?.querySelector('button[type="submit"]');
        
        this.init();
    }
    
    init() {
        // 检查是否已登录
        this.checkAuthStatus();
        
        // 绑定事件监听器
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
        
        // 添加全局鼠标柔和光效
        document.body.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // 初始化表单
        this.resetForm();
        
        // 初始化鼠标位置在中心
        document.body.style.setProperty('--mouse-x', '50%');
        document.body.style.setProperty('--mouse-y', '50%');
    }
    
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/check_auth', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.isLoggedIn && data.user) {
                    // 如果已登录，重定向到首页
                    window.location.href = '/';
                } else {
                    // 清除可能存在的过期认证数据
                    localStorage.removeItem('auth');
                    sessionStorage.removeItem('isLoggedIn');
                    sessionStorage.removeItem('currentUser');
                }
            } else {
                // HTTP错误状态码处理
                console.error('检查登录状态失败，HTTP状态码:', response.status);
                // 清除可能存在的过期认证数据
                localStorage.removeItem('auth');
                sessionStorage.removeItem('isLoggedIn');
                sessionStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error('检查登录状态时出错:', error);
            // 清除可能损坏的认证数据
            localStorage.removeItem('auth');
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('currentUser');
        }
    }
    
    handleMouseMove(e) {
        const x = e.clientX;
        const y = e.clientY;
        document.body.style.setProperty('--mouse-x', `${x}px`);
        document.body.style.setProperty('--mouse-y', `${y}px`);
    }
    
    resetForm() {
        if (this.form) {
            this.form.reset();
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value;
        const password = this.passwordInput.value;
        
        if (!username || !password) {
            showMessage('message', '请输入用户名和密码', 'error');
            return;
        }
        
        // 禁用提交按钮，防止重复提交
        const originalText = this.submitButton.innerHTML;
        this.submitButton.disabled = true;
        this.submitButton.innerHTML = '<span class="loading"></span> 登录中...';
        
        try {
            // 准备表单数据
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            // 向后端发送登录请求
            const data = await fetchPostForm('/login', formData);
            
            if (data.success) {
                showMessage('message', '登录成功！', 'success');
                
                const userData = {
                    id: data.user.id,
                    username: data.user.username,
                    email: data.user.email
                };

                // 更新store中的用户状态
                store.setUser(userData);

                // 同步到 sessionStorage，供 home.js initAuth() 使用
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                sessionStorage.setItem('isLoggedIn', 'true');

                // 添加一个短暂的延迟，确保状态已保存
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            } else {
                showMessage('message', data.message || '登录失败', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            showMessage('message', error.message || '网络错误，请稍后重试', 'error');
        } finally {
            // 恢复提交按钮状态
            this.submitButton.disabled = false;
            this.submitButton.innerHTML = originalText;
        }
    }
}

// 初始化登录模块
document.addEventListener('DOMContentLoaded', () => {
    new LoginModule();
});

export default LoginModule;