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
        const response = await fetch(url, {
            credentials: 'include'  // 携带 cookie 用于 session 认证
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

// 简化fetch POST请求
async function fetchPost(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',  // 携带 cookie 用于 session 认证
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText || `HTTP error! status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage = errorJson.message;
                }
            } catch (e) {
                // 不是 JSON，使用原始文本
            }
            throw new Error(errorMessage);
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
            credentials: 'include',  // 携带 cookie 用于 session 认证
            body: formData
        });
        
        // 特别处理登录响应
        if (url === '/login') {
            // 检查是否是重定向响应
            if (response.type === 'opaqueredirect' || response.redirected) {
                throw new Error('登录请求被重定向，请检查服务器配置');
            }
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText || `HTTP error! status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage = errorJson.message;
                }
            } catch (e) {
                // 不是 JSON，使用原始文本
            }
            throw new Error(errorMessage);
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

// 验证邮箱格式
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 验证手机号格式
function validatePhone(phone) {
    const re = /^1[3-9]\d{9}$/;
    return re.test(phone);
}

// 获取URL参数
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// 设置URL参数
function setUrlParams(params) {
    const url = new URL(window.location);
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    }
    window.history.replaceState({}, '', url);
}

/**
 * 简单的本地存储工具对象
 * @type {Object}
 */
const storage = {
    /**
     * 设置本地存储项
     * @param {string} key - 存储键
     * @param {any} value - 存储值
     * @returns {void}
     */
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    /**
     * 获取本地存储项
     * @param {string} key - 存储键
     * @returns {any} 存储值，如果不存在则返回 null
     */
    get(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    
    /**
     * 移除本地存储项
     * @param {string} key - 存储键
     * @returns {void}
     */
    remove(key) {
        localStorage.removeItem(key);
    },
    
    /**
     * 清空所有本地存储项
     * @returns {void}
     */
    clear() {
        localStorage.clear();
    }
};

// Cookie 工具对象
const cookies = {
    set(key, value, days = 7) {
        const expires = new Date(Date.now() + days * 86400000).toUTCString();
        document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
    },
    get(key) {
        const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(key)}=([^;]*)`));
        return match ? decodeURIComponent(match[1]) : null;
    },
    remove(key) {
        document.cookie = `${encodeURIComponent(key)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
};

// 将 storage 和 cookies 对象导出
export { storage, cookies };

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
    validateEmail,
    validatePhone,
    getUrlParams,
    setUrlParams
};