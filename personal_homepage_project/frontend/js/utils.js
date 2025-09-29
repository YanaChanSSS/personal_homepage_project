/**
 * 通用工具函数
 */

// 显示消息函数
function showMessage(elementId, text, type) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }
}

// 显示加载状态
function showLoading(buttonElement, loadingText = '处理中...') {
    if (buttonElement) {
        buttonElement.disabled = true;
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<span class="loading"></span> ${loadingText}`;
        return originalText;
    }
}

// 隐藏加载状态
function hideLoading(buttonElement, originalText) {
    if (buttonElement && originalText) {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalText;
    }
}

// 处理fetch请求错误
function handleFetchError(error, defaultMessage = '网络错误，请稍后重试') {
    console.error('Error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return '网络连接失败，请检查网络设置';
    }
    return error.message || defaultMessage;
}

// 简化fetch GET请求
async function fetchGet(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        throw new Error(handleFetchError(error));
    }
}

// 简化fetch POST请求
async function fetchPost(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        throw new Error(handleFetchError(error));
    }
}

// 简化fetch POST请求（表单数据）
async function fetchPostForm(url, formData) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        throw new Error(handleFetchError(error));
    }
}

// 防抖函数
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 检查元素是否在视口中
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// 平滑滚动到元素
function smoothScrollTo(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
        });
}

// 格式化日期
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
}

// 本地存储操作
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('LocalStorage set error:', e);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('LocalStorage get error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('LocalStorage remove error:', e);
            return false;
        }
    }
};

// Cookie操作
const cookies = {
    set(name, value, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
    },
    
    get(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    },
    
    remove(name) {
        this.set(name, "", -1);
    }
};

// 表单验证函数
const validators = {
    // 验证邮箱格式
    email(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // 验证密码强度
    password(password) {
        // 至少8位，包含大小写字母、数字和特殊字符
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        return re.test(password);
    },
    
    // 验证用户名
    username(username) {
        // 3-20位，只能包含字母、数字、下划线
        const re = /^[a-zA-Z0-9_]{3,20}$/;
        return re.test(username);
    }
};

// 导出所有函数
export {
    showMessage,
    showLoading,
    hideLoading,
    handleFetchError,
    fetchGet,
    fetchPost,
    fetchPostForm,
    debounce,
    throttle,
    isInViewport,
    smoothScrollTo,
    formatDate,
    storage,
    cookies,
    validators
};