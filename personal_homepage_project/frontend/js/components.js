// 组件管理系统 - 管理可复用的UI组件
import { showMessage } from './utils.js';

// 通知组件
class Notification {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // 创建通知容器
    this.container = document.createElement('div');
    this.container.className = 'notifications-container';
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">${message}</div>
      <button class="notification-close">&times;</button>
    `;

    // 添加样式
    Object.assign(notification.style, {
      position: 'relative',
      padding: '12px 20px',
      margin: '10px 0',
      borderRadius: '4px',
      color: 'white',
      backgroundColor: this.getColorByType(type),
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s ease-out',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    });

    // 添加关闭按钮样式
    const closeBtn = notification.querySelector('.notification-close');
    Object.assign(closeBtn.style, {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '0',
      marginLeft: '15px'
    });

    this.container.appendChild(notification);

    // 显示动画
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);

    // 自动关闭
    if (duration > 0) {
      setTimeout(() => {
        this.hide(notification);
      }, duration);
    }

    // 关闭按钮事件
    closeBtn.addEventListener('click', () => {
      this.hide(notification);
    });

    return notification;
  }

  hide(notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
      if (notification.parentNode === this.container) {
        this.container.removeChild(notification);
      }
    }, 300);
  }

  getColorByType(type) {
    const colors = {
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3'
    };
    
    return colors[type] || colors.info;
  }
}

// 加载指示器组件
class LoadingIndicator {
  constructor() {
    this.element = null;
  }

  show(targetElement = document.body, message = '') {
    // 如果已经存在，直接返回
    if (this.element) {
      return;
    }

    this.element = document.createElement('div');
    this.element.className = 'loading-overlay';
    this.element.innerHTML = `
      <div class="loading-spinner"></div>
      ${message ? `<div class="loading-message">${message}</div>` : ''}
    `;

    // 添加样式
    Object.assign(this.element.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      zIndex: '9999'
    });

    const spinner = this.element.querySelector('.loading-spinner');
    Object.assign(spinner.style, {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: '4px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    targetElement.appendChild(this.element);
  }

  hide() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }
}

// 模态框组件
class Modal {
  constructor(options = {}) {
    this.options = {
      title: '',
      content: '',
      closable: true,
      ...options
    };
    
    this.element = null;
    this.onClose = null;
  }

  show() {
    // 如果已经存在，直接返回
    if (this.element) {
      return;
    }

    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';
    this.element.innerHTML = `
      <div class="modal">
        ${this.options.title ? `<div class="modal-header">
          <h3>${this.options.title}</h3>
          ${this.options.closable ? '<button class="modal-close">&times;</button>' : ''}
        </div>` : ''}
        <div class="modal-body">${this.options.content}</div>
        ${this.options.buttons ? `<div class="modal-footer">${this.options.buttons}</div>` : ''}
      </div>
    `;

    // 添加样式
    Object.assign(this.element.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '10000'
    });

    const modal = this.element.querySelector('.modal');
    Object.assign(modal.style, {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto'
    });

    document.body.appendChild(this.element);

    // 绑定事件
    if (this.options.closable) {
      const closeBtn = this.element.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.hide();
        });
      }
    }

    // 点击背景关闭
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element && this.options.closable) {
        this.hide();
      }
    });

    // ESC键关闭
    const handleEsc = (e) => {
      if (e.key === 'Escape' && this.options.closable) {
        this.hide();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    
    document.addEventListener('keydown', handleEsc);
  }

  hide() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
      
      if (this.onClose) {
        this.onClose();
      }
    }
  }

  onClose(callback) {
    this.onClose = callback;
    return this;
  }
}

// 表单组件
class Form {
  constructor(formElement) {
    this.form = formElement;
    this.fields = {};
    this.validators = {};
  }

  // 添加字段
  addField(name, validator) {
    this.fields[name] = this.form.querySelector(`[name="${name}"]`) || 
                       this.form.querySelector(`#${name}`);
    this.validators[name] = validator;
    return this;
  }

  // 验证表单
  validate() {
    const results = {};
    let isValid = true;

    for (const [name, field] of Object.entries(this.fields)) {
      if (field && this.validators[name]) {
        const value = field.value;
        const errors = this.validators[name](value);
        
        results[name] = {
          valid: errors.length === 0,
          errors
        };
        
        if (errors.length > 0) {
          isValid = false;
          this.showFieldError(field, errors[0]);
        } else {
          this.clearFieldError(field);
        }
      }
    }

    return {
      valid: isValid,
      fields: results
    };
  }

  // 显示字段错误
  showFieldError(field, message) {
    this.clearFieldError(field);
    
    field.classList.add('is-invalid');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    Object.assign(errorElement.style, {
      color: '#e53e3e',
      fontSize: '14px',
      marginTop: '5px'
    });
    
    field.parentNode.appendChild(errorElement);
  }

  // 清除字段错误
  clearFieldError(field) {
    field.classList.remove('is-invalid');
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  // 序列化表单数据
  serialize() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }

  // 绑定提交事件
  onSubmit(handler) {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const validation = this.validate();
      if (validation.valid) {
        try {
          await handler(this.serialize());
        } catch (error) {
          showMessage('message', error.message || '操作失败', 'error');
        }
      }
    });
    
    return this;
  }
}

// 创建并导出组件实例
const notification = new Notification();
const loading = new LoadingIndicator();

export {
  Notification,
  LoadingIndicator,
  Modal,
  Form,
  notification,
  loading
};