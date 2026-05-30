// 认证相关功能
import store from './store.js';

// 检查认证状态
export const checkAuth = async () => {
    try {
        const response = await fetch('/api/check_auth', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // 检查响应状态，如果非2xx，视为未登录
        if (!response.ok) {
            console.warn('检查登录状态时HTTP请求失败:', response.status);
            // 确保store中的状态是未登录
            store.setState({
                user: {
                    isLoggedIn: false,
                    profile: null,
                    permissions: []
                }
            });
            return false;
        }
        
        const data = await response.json();
        
        // 根据API返回的数据更新状态
        if (data.isLoggedIn && data.user) {
            // 更新store中的用户状态
            store.setState({
                user: {
                    isLoggedIn: true,
                    profile: data.user,
                    permissions: data.permissions || []
                }
            });
            return true;
        } else {
            // API返回未登录，也更新store状态
            store.setState({
                user: {
                    isLoggedIn: false,
                    profile: null,
                    permissions: []
                }
            });
            return false;
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
        // 网络错误或其它异常，统一视为未登录
        store.setState({
            user: {
                isLoggedIn: false,
                profile: null,
                permissions: []
            }
        });
        return false;
    }
};

// 登出函数
export const logout = async () => {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('登出失败:', error);
    } finally {
        // 重置store中的用户状态
        store.setState({
            user: {
                isLoggedIn: false,
                profile: null,
                permissions: []
            }
        });
        
        // 重定向到首页
        window.location.href = '/frontend/home.html';
    }
};

export const updateUIAfterLogin = (user) => {
    // 更新导航栏
    const loginTrigger = document.getElementById('login-trigger');
    const userProfile = document.getElementById('user-profile');
    const userAvatar = document.getElementById('user-avatar');
    
    if (loginTrigger) loginTrigger.style.display = 'none';
    if (userProfile) {
        userProfile.style.display = '';
        if (user.avatar) {
            userAvatar.src = user.avatar;
        }
    }
};

// 初始化检查登录状态
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
});
