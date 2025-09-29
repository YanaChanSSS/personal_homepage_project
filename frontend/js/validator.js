// 表单验证器 - 处理各种表单验证逻辑
class Validator {
  constructor() {
    // 定义验证规则
    this.rules = {
      required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      minLength: (min) => (value) => value.length >= min,
      maxLength: (max) => (value) => value.length <= max,
      pattern: (regex) => (value) => regex.test(value),
      sameAs: (fieldId) => (value) => value === document.getElementById(fieldId)?.value,
      custom: (fn) => fn
    };
  }

  // 验证单个字段
  validateField(field, rules) {
    const value = field.value;
    const errors = [];

    for (const rule of rules) {
      const [ruleName, ruleValue, message] = rule;

      if (ruleName === 'required' && !this.rules.required(value)) {
        errors.push(message || '此字段为必填项');
        break; // required规则失败后不再检查其他规则
      }

      if (this.rules.required(value) && ruleValue !== undefined) {
        const validator = this.rules[ruleName](ruleValue);
        if (!validator(value)) {
          errors.push(message || this.getDefaultMessage(ruleName, ruleValue));
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 验证整个表单
  validateForm(form, fieldRules) {
    const results = {};
    let isValid = true;

    for (const [fieldName, rules] of Object.entries(fieldRules)) {
      const field = form.querySelector(`[name="${fieldName}"]`) || 
                   form.querySelector(`#${fieldName}`);
      
      if (field) {
        const result = this.validateField(field, rules);
        results[fieldName] = result;
        if (!result.valid) {
          isValid = false;
        }
      }
    }

    return {
      valid: isValid,
      fields: results
    };
  }

  // 显示字段错误
  showFieldError(field, errors) {
    // 清除之前的错误
    this.clearFieldError(field);

    if (errors.length > 0) {
      // 添加错误样式
      field.classList.add('is-invalid');
      
      // 创建错误消息元素
      const errorElement = document.createElement('div');
      errorElement.className = 'invalid-feedback';
      errorElement.textContent = errors[0]; // 只显示第一个错误
      
      // 插入到字段后面
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
  }

  // 清除字段错误
  clearFieldError(field) {
    field.classList.remove('is-invalid');
    const errorElement = field.parentNode.querySelector('.invalid-feedback');
    if (errorElement) {
      errorElement.remove();
    }
  }

  // 获取默认错误消息
  getDefaultMessage(ruleName, ruleValue) {
    const messages = {
      email: '请输入有效的邮箱地址',
      minLength: `长度不能少于${ruleValue}个字符`,
      maxLength: `长度不能超过${ruleValue}个字符`,
      sameAs: '两次输入的值不一致',
      pattern: '格式不正确'
    };
    
    return messages[ruleName] || '输入值不符合要求';
  }

  // 实时验证（防抖）
  liveValidate(field, rules, delay = 300) {
    let timeoutId;
    
    const validate = () => {
      const result = this.validateField(field, rules);
      this.showFieldError(field, result.errors);
      return result;
    };

    field.addEventListener('input', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(validate, delay);
    });

    field.addEventListener('blur', validate);
  }

  // 密码强度验证
  validatePasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?\":{}|<>]/.test(password)
    };

    const strength = Object.values(checks).filter(Boolean).length;
    
    return {
      valid: strength >= 4, // 至少满足4个条件
      strength,
      checks
    };
  }

  // 显示密码强度
  showPasswordStrength(password, strengthMeter, strengthText) {
    const result = this.validatePasswordStrength(password);
    
    // 更新强度条
    if (strengthMeter) {
      strengthMeter.style.width = (result.strength * 20) + '%';
      
      // 设置颜色
      let color = '#e53e3e'; // 弱
      if (result.strength >= 4) color = '#38a169'; // 强
      else if (result.strength >= 3) color = '#dd6b20'; // 中等
      
      strengthMeter.style.backgroundColor = color;
    }
    
    // 更新文本
    if (strengthText) {
      let text = '弱';
      let className = 'weak';
      
      if (result.strength >= 4) {
        text = '强';
        className = 'strong';
      } else if (result.strength >= 3) {
        text = '中等';
        className = 'medium';
      }
      
      strengthText.textContent = text;
      strengthText.className = className;
    }
    
    return result;
  }
}

// 创建并导出验证器实例
const validator = new Validator();
export default validator;