// home.js - 综合功能脚本 (登录面板 + 滚动效果 + 鼠标特效 + 手机端分页)

import apiClient from './api.js';

document.addEventListener('DOMContentLoaded', function () {
    // ======== 原有功能元素获取 ========
    const panel = document.getElementById('auth-panel');
    const loginTrigger = document.getElementById('login-trigger');
    const panelClose = document.querySelector('.panel-close');
    const loginBtn = document.querySelector('.tab-button[data-tab="login"]');
    const registerBtn = document.querySelector('.tab-button[data-tab="register"]');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const header = document.querySelector('header');
    const body = document.body;
    // 获取用户头像元素
    const userProfile = document.getElementById('user-profile');
    const userAvatar = document.querySelector('.user-avatar');

    // ======== 新增：手机端分页相关元素获取 ========
    const pages = document.querySelectorAll('.page');
    const navItems = document.querySelectorAll('.mobile-nav .nav-item');
    const mobileNav = document.querySelector('.mobile-nav');

    // ======== 函数定义区域 ========

    // 判断是否为移动端
    function isMobile() {
        return window.innerWidth < 768;
    }

    // 显示指定页面（手机端）
    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        navItems.forEach(item => item.classList.remove('active'));

        const targetPage = document.getElementById(pageId);
        const targetNavItem = document.querySelector(`.mobile-nav .nav-item[data-page="${pageId}"]`);

        if (targetPage) targetPage.classList.add('active');
        if (targetNavItem) targetNavItem.classList.add('active');
    }

    // 初始化手机端/电脑端布局
    function initLayout() {
        if (isMobile()) {
            mobileNav.style.display = 'flex';
            // 确保只有首页显示
            pages.forEach((page, index) => {
                page.classList.toggle('active', index === 0);
            });
            // 默认激活首页导航
            showPage('page-home');
        } else {
            mobileNav.style.display = 'none';
            pages.forEach(page => page.classList.add('active'));
        }
    }

    // ======== 原有功能：登录面板逻辑 ========
    if (loginTrigger && panel) {
        loginTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            panel.classList.add('active');
        });

        if (panelClose) {
            panelClose.addEventListener('click', () => {
                panel.classList.remove('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== loginTrigger) {
                panel.classList.remove('active');
            }
        });
    }

    // 标签页切换
    if (loginBtn && registerBtn && loginForm && registerForm) {
        loginBtn.addEventListener('click', () => {
            loginBtn.classList.add('active');
            registerBtn.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        });

        registerBtn.addEventListener('click', () => {
            registerBtn.classList.add('active');
            loginBtn.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        });
    }

    // 修改登录表单提交逻辑
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.querySelector('#login-form input[name="username"]').value;
            const password = document.querySelector('#login-form input[name="password"]').value;
            
            if (!username || !password) {
                alert('请输入用户名和密码');
                return;
            }
            
            const loginButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = loginButton.innerHTML;
            
            try {
                // 禁用登录按钮，防止重复提交
                loginButton.disabled = true;
                loginButton.innerHTML = '登录中...';
                
                // 准备登录凭据
                const credentials = {
                    username: username,
                    password: password
                };
                
                // 使用API客户端登录
                const result = await apiClient.login(credentials);
                
                if (result.success) {
                    console.log('登录成功响应:', result);
                    
                    // 准备用户数据
                    const userData = result.user || {
                        username: result.username,
                        avatar: result.avatar || '/static/images/default-avatar.png'
                    };
                    
                    // 更新存储
                    const authData = {
                        user: userData,
                        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24小时后过期
                    };
                    
                    // 保存到 sessionStorage 和 localStorage
                    sessionStorage.setItem('currentUser', JSON.stringify(userData));
                    sessionStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('auth', JSON.stringify(authData));
                    
                    console.log('用户登录信息已保存');
                    
                    // 关闭登录面板
                    if (panel) {
                        panel.classList.remove('active');
                        console.log('登录面板已关闭');
                    }
                    
                    // 使用 updateLoginUI 更新界面
                    await updateLoginUI(true, userData);
                    
                    // 显示登录成功提示
                    showNotification('登录成功！', 'success');
                } else {
                    throw new Error(result.message || '登录失败，请检查用户名和密码');
                }
            } catch (error) {
                console.error('登录过程中出错:', error);
                showNotification(error.message || '登录失败，请稍后再试', 'error');
            } finally {
                // 恢复登录按钮状态
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.innerHTML = originalButtonText;
                }
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // 模拟注册成功
            alert('注册成功！');
            if (registerBtn) registerBtn.click(); // 自动切回登录页
        });
    }

    // 点击头像跳转到个人资料页
    if (userAvatar) {
        userAvatar.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    // ======== 原有功能：滚动效果 ========
    const handleScroll = () => {
        if (window.scrollY > 50) {
            if (header) header.classList.add('scrolled');
        } else {
            if (header) header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);

    // ======== 原有功能：背景随鼠标移动 ========
    const handleMouseMove = (e) => {
        const xPercent = (e.clientX / window.innerWidth).toFixed(3);
        const yPercent = (e.clientY / window.innerHeight).toFixed(3);
        body.style.backgroundPosition = `${xPercent * 100}% ${yPercent * 100}%`;
    };

    document.addEventListener('mousemove', handleMouseMove);

    // ======== 升级版：带颜色渐变的鼠标拖影（节流） ========
    let isThrottled = false;

    const createTrail = (e) => {
        const trail = document.createElement('div');
        trail.classList.add('mouse-trail');

        // 设置初始位置
        trail.style.left = `${e.clientX}px`;
        trail.style.top = `${e.clientY}px`;

        // 随机大小 (4px ~ 12px)
        const size = Math.random() * 8 + 4;
        trail.style.width = `${size}px`;
        trail.style.height = `${size}px`;

        // 初始颜色：使用 HSL，色相随机（0~360）
        const hue = Math.random() * 360;
        trail.style.backgroundColor = `hsl(${hue}, 100%, 65%)`;

        document.body.appendChild(trail);

        // 启动动画：1.5秒内颜色变化 + 透明度淡出 + 缩放
        setTimeout(() => {
            trail.style.transform = 'scale(1.5)';
            trail.style.backgroundColor = `hsl(${(hue + 60) % 360}, 100%, 70%)`;
            trail.style.opacity = '0';
        }, 10);

        // 1.5秒后移除（与CSS transition时间一致）
        setTimeout(() => {
            trail.remove();
        }, 1500);
    };

    const throttledMouse = (e) => {
        if (!isThrottled) {
            createTrail(e);
            isThrottled = true;
            setTimeout(() => {
                isThrottled = false;
            }, 30); // 控制拖影密度（越小越密集）
        }
    };

    document.addEventListener('mousemove', throttledMouse);

    // ======== 新增：手机端导航绑定事件 ========
    if (navItems) {
        navItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                const pageId = this.getAttribute('data-page');
                showPage(pageId);
            });
        });
    }

    // ======== 窗口大小改变时重新初始化布局 ========
    window.addEventListener('resize', initLayout);

    // ======== 更新登录状态和UI ========
    async function updateLoginUI(isLoggedIn, userData = null) {
        console.log('更新登录UI，状态:', isLoggedIn, '用户数据:', userData);
        
        if (isLoggedIn) {
            // 用户已登录
            if (loginTrigger) loginTrigger.style.display = 'none';
            if (userProfile) {
                userProfile.classList.remove('hidden');
                userProfile.style.display = 'flex';
                // 更新用户头像
                const avatarImg = userProfile.querySelector('img');
                if (avatarImg) {
                    // 添加时间戳防止缓存
                    avatarImg.src = userData?.avatar || '/static/images/default-avatar.png' + '?t=' + Date.now();
                }
                // 更新用户名
                const usernameSpan = userProfile.querySelector('.username');
                if (usernameSpan && userData?.username) {
                    usernameSpan.textContent = userData.username;
                }
            }
            
            // 更新全局状态
            document.documentElement.setAttribute('data-logged-in', 'true');
            // 同时保存到sessionStorage和localStorage
            sessionStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('isLoggedIn', 'true');
            if (userData) {
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('currentUser', JSON.stringify(userData));
            }
        } else {
            // 用户未登录
            if (loginTrigger) loginTrigger.style.display = 'block';
            if (userProfile) userProfile.classList.add('hidden');
            
            // 更新全局状态
            document.documentElement.setAttribute('data-logged-in', 'false');
            // 清除存储的登录状态
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
        }
    }

    // 检查登录状态
    async function checkLoginStatus() {
        try {
            console.log('后台验证服务器登录状态...');
            const response = await apiClient.checkLoginStatus();
            console.log('服务器登录状态:', response);

            const isLoggedIn = response?.logged_in === true || response?.isLoggedIn === true;
            const username = response?.username || response?.user?.username;

            if (isLoggedIn && username) {
                const userData = {
                    username: username,
                    avatar: response?.avatar || response?.user?.avatar || '/static/images/default-avatar.png'
                };

                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                sessionStorage.setItem('isLoggedIn', 'true');

                await updateLoginUI(true, userData);
                return true;
            } else {
                // 服务器说未登录，但检查 store 中的状态（main.js 可能已更新）
                try {
                    const { store: storeModule } = await import('/frontend/js/store.js');
                    const storeUser = storeModule.default.getState().user;
                    if (storeUser && storeUser.isLoggedIn && storeUser.profile) {
                        // store 中有登录状态（main.js checkAuth 已完成），以 store 为准
                        console.log('服务器返回未登录但 store 中已登录，保持登录状态');
                        await updateLoginUI(true, storeUser.profile);
                        return true;
                    }
                } catch (e) {
                    // store 不可用，忽略
                }

                // 确认未登录时才清除
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('isLoggedIn');
                await updateLoginUI(false);
                return false;
            }
        } catch (error) {
            console.error('检查登录状态时出错:', error);
            const sessionUser = sessionStorage.getItem('currentUser');
            const localUser = localStorage.getItem('currentUser');

            if (sessionUser) {
                try {
                    const userData = JSON.parse(sessionUser);
                    await updateLoginUI(true, userData);
                    return true;
                } catch (e) {}
            }

            if (localUser) {
                try {
                    const userData = JSON.parse(localUser);
                    sessionStorage.setItem('currentUser', localUser);
                    sessionStorage.setItem('isLoggedIn', 'true');
                    await updateLoginUI(true, userData);
                    return true;
                } catch (e) {}
            }

            await updateLoginUI(false);
            return false;
        }
    }

    // 初始化认证状态
    async function initAuth() {
        // 优先从 store 读取状态（main.js 的 store.restoreState() 已从 localStorage 恢复）
        const storeState = window.app ? null : null; // main.js 还未初始化时稍后处理
        let isLoggedIn = false;
        let userData = null;

        // 1. 先尝试从 store 读取（main.js 可能已完成初始化）
        try {
            const { store: storeModule } = await import('/frontend/js/store.js');
            const storeUser = storeModule.default.getState().user;
            if (storeUser && storeUser.isLoggedIn && storeUser.profile) {
                isLoggedIn = true;
                userData = storeUser.profile;
                console.log('initAuth: 从 store 恢复登录状态', userData);
            }
        } catch (e) {
            console.warn('initAuth: 无法从 store 读取状态', e);
        }

        // 2. 回退到 sessionStorage / localStorage
        if (!isLoggedIn) {
            const sessionUser = sessionStorage.getItem('currentUser');
            if (sessionUser) {
                try {
                    userData = JSON.parse(sessionUser);
                    isLoggedIn = true;
                    console.log('initAuth: 从 sessionStorage 恢复登录状态');
                } catch (e) {
                    console.error('解析 sessionStorage 用户数据失败:', e);
                }
            }
        }

        if (!isLoggedIn) {
            const localUser = localStorage.getItem('currentUser');
            if (localUser) {
                try {
                    userData = JSON.parse(localUser);
                    isLoggedIn = true;
                    // 同步到 sessionStorage
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('currentUser', localUser);
                    console.log('initAuth: 从 localStorage 恢复登录状态');
                } catch (e) {
                    console.error('解析 localStorage 用户数据失败:', e);
                }
            }
        }

        // 立即更新UI
        await updateLoginUI(isLoggedIn, userData);

        // 如果有本地状态，后台验证服务器端（但不覆盖已登录状态）
        if (isLoggedIn && userData) {
            checkLoginStatus().catch(error => {
                console.error('后台验证登录状态失败:', error);
            });
        } else {
            // 没有本地状态，检查服务器是否有 session
            checkLoginStatus().catch(error => {
                console.error('检查登录状态失败:', error);
            });
        }
    }

    // ======== 初始化 ========
    handleScroll();
    initLayout(); // 必须最后调用，确保所有元素已加载
    
    // 初始化认证状态
    initAuth();
});