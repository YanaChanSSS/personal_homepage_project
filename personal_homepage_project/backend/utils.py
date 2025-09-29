#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
后端工具函数
"""

import re
import hashlib
import random
import string
from datetime import datetime

def validate_password_strength(password):
    """
    验证密码强度
    要求：
    1. 长度至少8位
    2. 包含大写字母
    3. 包含小写字母
    4. 包含数字
    5. 包含特殊字符
    """
    if len(password) < 8:
        return False, "密码长度至少8位"
    
    if not re.search(r"[A-Z]", password):
        return False, "密码必须包含大写字母"
    
    if not re.search(r"[a-z]", password):
        return False, "密码必须包含小写字母"
    
    if not re.search(r"\d", password):
        return False, "密码必须包含数字"
    
    # 特殊字符检查
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "密码必须包含特殊字符"
    
    # 检查是否为常见弱密码
    weak_passwords = ['password', '12345678', 'qwertyui', 'admin1234']
    if password.lower() in weak_passwords:
        return False, "密码过于简单，请选择更复杂的密码"
    
    return True, "密码强度符合要求"

def generate_captcha(length=4):
    """
    生成图形验证码
    """
    chars = string.ascii_uppercase + string.digits
    captcha = ''.join(random.choice(chars) for _ in range(length))
    return captcha

def hash_email_code(email, code):
    """
    对邮箱验证码进行哈希处理
    """
    return hashlib.sha256(f"{email}:{code}".encode()).hexdigest()

def validate_email(email):
    """
    验证邮箱格式
    """
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def format_datetime(dt):
    """
    格式化日期时间
    """
    if isinstance(dt, datetime):
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    return dt