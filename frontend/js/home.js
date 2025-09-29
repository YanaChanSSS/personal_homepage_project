// home.js - 综合功能脚本 (登录面板 + 滚动效果 + 鼠标特效 + 手机端分页)

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

    // 检查用户登录状态
    function checkLoginStatus() {
        // 这里应该通过API检查登录状态，现在我们使用sessionStorage模拟
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn) {
            // 用户已登录，隐藏登录链接，显示用户头像
            loginTrigger.style.display = 'none';
            userProfile.style.display = 'block';
        } else {
            // 用户未登录，显示登录链接，隐藏用户头像
            loginTrigger.style.display = 'block';
            userProfile.style.display = 'none';
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

    // 表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // 模拟登录成功
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('currentUser', JSON.stringify({
                username: document.querySelector('#login-form input[name="username"]').value
            }));
            checkLoginStatus();
            if (panel) panel.classList.remove('active');
            alert('登录成功！');
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
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
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
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // ======== 窗口大小改变时重新初始化布局 ========
    window.addEventListener('resize', initLayout);

    // ======== 初始化 ========
    handleScroll();
    initLayout(); // 必须最后调用，确保所有元素已加载
    checkLoginStatus(); // 检查登录状态
});

// 引入工具函数
import { showMessage, fetchGet, storage } from './utils.js';

// 页面切换功能
function switchPage(targetPageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新移动端导航栏激活状态
    document.querySelectorAll('.mobile-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === targetPageId) {
            item.classList.add('active');
        }
    });
}

// 检查用户登录状态
async function checkLoginStatus() {
    try {
        const data = await fetchGet('/api/check_login');
        const loginTrigger = document.getElementById('login-trigger');
        const userProfile = document.getElementById('user-profile');
        
        if (data.logged_in) {
            loginTrigger.style.display = 'none';
            userProfile.style.display = 'block';
            // 可以在这里设置用户名等信息
        } else {
            loginTrigger.style.display = 'block';
            userProfile.style.display = 'none';
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
    }
}

// 初始化页面功能
function initPage() {
    // 移动端导航栏点击事件
    document.querySelectorAll('.mobile-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');
            switchPage(targetPage);
        });
    });
    
    // 检查登录状态
    checkLoginStatus();
    
    // 添加平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 添加视差滚动效果
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        const background = document.querySelector('body');
        if (background) {
            background.style.backgroundPosition = `0 ${rate}px`;
        }
    });
    
    // 添加鼠标移动效果
    document.body.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        
        document.body.style.setProperty('--mouse-x', `${x}px`);
        document.body.style.setProperty('--mouse-y', `${y}px`);
    });
    
    // 初始化鼠标位置在中心
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    document.body.style.setProperty('--mouse-x', `${centerX}px`);
    document.body.style.setProperty('--mouse-y', `${centerY}px`);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);

// 导出函数供其他模块使用
export { switchPage, checkLoginStatus };
