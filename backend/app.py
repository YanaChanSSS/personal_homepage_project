#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
个人主页后端应用主文件
"""

import os
import sys

# 将项目根目录添加到Python路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from redis import Redis
import re
import json
import hashlib

from backend.config import config
from backend.models import db, User, Message

def create_app(config_name=None):
    """应用工厂函数"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'default')
    
    app = Flask(__name__,
                template_folder='../frontend',
                static_folder='../frontend',
                static_url_path='')
    
    app.config.from_object(config[config_name])
    
    # 初始化扩展
    db.init_app(app)
    
    # 初始化Redis连接
    redis_host = app.config.get('REDIS_HOST', 'localhost')
    redis_port = app.config.get('REDIS_PORT', 6379)
    redis_db = app.config.get('REDIS_DB', 0)
    redis_password = app.config.get('REDIS_PASSWORD', None)
    
    app.redis_client = Redis(
        host=redis_host,
        port=redis_port,
        db=redis_db,
        password=redis_password,
        decode_responses=True
    )
    
    # 注册蓝图或路由
    register_routes(app)
    
    return app

def register_routes(app):
    """注册路由"""
    
    @app.route('/')
    def index():
        """首页"""
        return render_template('home.html')
    
    @app.route('/login')
    def login_page():
        """登录页面"""
        return render_template('login.html')
    
    @app.route('/register')
    def register_page():
        """注册页面"""
        return render_template('register.html')
    
    @app.route('/profile')
    def profile_page():
        """个人资料页面"""
        return render_template('profile.html')
    
    # API路由
    @app.route('/api/check_login')
    def check_login():
        """检查登录状态"""
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user:
                return jsonify({
                    'logged_in': True,
                    'username': user.username
                })
        return jsonify({'logged_in': False})
    
    @app.route('/api/user_info')
    def user_info():
        """获取用户信息"""
        if 'user_id' not in session:
            return jsonify({'error': '未登录'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        return jsonify({
            'username': user.username,
            'email': user.email,
            'bio': user.bio
        })
    
    @app.route('/api/messages')
    def get_messages():
        """获取留言列表"""
        messages = Message.query.order_by(Message.created_at.desc()).all()
        result = []
        for msg in messages:
            msg_dict = {
                'id': msg.id,
                'username': msg.username,
                'content': msg.content,
                'date': msg.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            result.append(msg_dict)
        return jsonify(result)

# 创建默认应用实例（用于开发）
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)