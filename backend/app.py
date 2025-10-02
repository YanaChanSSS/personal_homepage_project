#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
个人主页后端应用主文件
"""

import os
import sys
import random
import string
import traceback

# 将项目根目录添加到Python路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from redis import Redis
import re
import json
import hashlib
from flask_mail import Mail, Message

from backend.config import config
from backend.models import db, User, Message as DbMessage
from backend.utils import generate_captcha, hash_email_code, validate_email

def create_app(config_name=None):
    """应用工厂函数"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'default')
    
    app = Flask(__name__,
                template_folder='../frontend',
                static_folder='../frontend',
                static_url_path='/frontend')
    
    app.config.from_object(config[config_name])
    
    # 初始化扩展
    db.init_app(app)
    
    # 初始化邮件功能
    mail = Mail(app)
    app.mail = mail
    
    # 初始化Redis连接
    redis_host = app.config.get('REDIS_HOST', 'localhost')
    redis_port = app.config.get('REDIS_PORT', 6379)
    redis_db = app.config.get('REDIS_DB', 0)
    redis_password = app.config.get('REDIS_PASSWORD', None)
    
    # 如果Redis密码是空字符串，则设置为None
    if redis_password == "":
        redis_password = None
    
    try:
        app.redis_client = Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            password=redis_password,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        # 测试Redis连接
        app.redis_client.ping()
        print("Redis连接成功")
    except Exception as e:
        print(f"Redis连接失败: {str(e)}")
        # 即使Redis连接失败也继续启动应用
        app.redis_client = None
    
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
    
    # 静态文件路由 - 确保Flask能处理静态文件请求
    @app.route('/frontend/<path:filename>')
    def frontend_static(filename):
        """处理前端静态文件"""
        return app.send_static_file(filename)
    
    @app.route('/send_email_code', methods=['POST'])
    def send_email_code():
        """发送邮箱验证码"""
        try:
            data = request.get_json()
            email = data.get('email', '')
            
            # 验证邮箱格式
            if not validate_email(email):
                return jsonify({'success': False, 'message': '邮箱格式不正确'}), 400
            
            # 生成6位随机验证码
            code = ''.join(random.choices(string.digits, k=6))
            
            # 将验证码存入Redis，设置5分钟过期时间
            if app.redis_client:
                app.redis_client.setex(f"email_code:{email}", 300, code)
            else:
                print("警告: Redis未连接，无法存储验证码")
                # 在开发环境中，可以考虑将验证码打印到控制台
                print(f"邮箱 {email} 的验证码是: {code}")
            
            # 发送邮件
            msg = Message()
            msg.subject = '注册验证码'
            msg.sender = app.config.get('MAIL_USERNAME')
            msg.recipients = [email]
            msg.body = f'您的验证码是: {code}，5分钟内有效。'
            
            app.mail.send(msg)
            
            return jsonify({'success': True, 'message': '验证码已发送'})
        except Exception as e:
            # 打印详细的错误信息到日志
            error_info = traceback.format_exc()
            print(f"发送邮件验证码失败: {str(e)}")
            print(f"详细错误信息:\n{error_info}")
            
            # 根据错误类型返回更具体的错误信息
            error_str = str(e).lower()
            if "connection refused" in error_str:
                return jsonify({'success': False, 'message': '邮件服务器连接失败，请检查邮件配置'}), 500
            elif "timeout" in error_str:
                return jsonify({'success': False, 'message': '邮件发送超时，请稍后重试'}), 500
            elif "authentication" in error_str or "auth" in error_str:
                return jsonify({'success': False, 'message': '邮件认证失败，请检查用户名和密码'}), 500
            elif "ssl" in error_str or "tls" in error_str:
                return jsonify({'success': False, 'message': 'SSL/TLS连接错误，请检查邮件服务器配置'}), 500
            elif "connection unexpectedly closed" in error_str:
                return jsonify({'success': False, 'message': '邮件服务器连接意外关闭，请检查网络连接和邮件配置'}), 500
            elif "AuthenticationError" in str(e):
                return jsonify({'success': False, 'message': 'Redis认证失败，请检查Redis配置'}), 500
            else:
                return jsonify({'success': False, 'message': f'验证码发送失败: {str(e)}'}), 500
    
    @app.route('/check_username', methods=['POST'])
    def check_username():
        """检查用户名是否已存在"""
        try:
            data = request.get_json()
            username = data.get('username', '')
            
            # 查询数据库中是否存在该用户名
            user = User.query.filter_by(username=username).first()
            
            return jsonify({'exists': user is not None})
        except Exception as e:
            print(f"检查用户名失败: {str(e)}")
            return jsonify({'error': '服务器内部错误'}), 500
    
    @app.route('/check_email', methods=['POST'])
    def check_email():
        """检查邮箱是否已存在"""
        try:
            data = request.get_json()
            email = data.get('email', '')
            
            # 查询数据库中是否存在该邮箱
            user = User.query.filter_by(email=email).first()
            
            return jsonify({'exists': user is not None})
        except Exception as e:
            print(f"检查邮箱失败: {str(e)}")
            return jsonify({'error': '服务器内部错误'}), 500
    
    @app.route('/api/check_login')
    def check_login():
        """检查登录状态"""
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user:
                return jsonify({
                    'logged_in': True,
                    'username': user.username,
                    'is_admin': user.is_admin  # 添加管理员标识
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
            'bio': user.bio,
            'is_admin': user.is_admin  # 添加管理员标识
        })
    
    @app.route('/api/messages')
    def get_messages():
        """获取留言列表"""
        # 检查用户是否登录
        if 'user_id' not in session:
            return jsonify({'error': '未登录'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': '用户不存在'}), 404
            
        messages = DbMessage.query.order_by(DbMessage.created_at.desc()).all()
        result = []
        for msg in messages:
            msg_dict = {
                'id': msg.id,
                'username': msg.username,
                'content': msg.content,
                'date': msg.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            # 如果是管理员，可以添加管理功能
            if user.is_admin:
                msg_dict['can_manage'] = True
            result.append(msg_dict)
        return jsonify(result)
    
    @app.route('/api/messages/<int:message_id>', methods=['DELETE'])
    def delete_message(message_id):
        """删除留言（仅管理员）"""
        # 检查用户是否登录
        if 'user_id' not in session:
            return jsonify({'error': '未登录'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': '用户不存在'}), 404
            
        # 检查是否是管理员
        if not user.is_admin:
            return jsonify({'error': '权限不足'}), 403
            
        # 查找并删除留言
        message = DbMessage.query.get(message_id)
        if not message:
            return jsonify({'error': '留言不存在'}), 404
            
        try:
            db.session.delete(message)
            db.session.commit()
            return jsonify({'success': True, 'message': '留言删除成功'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': '删除失败: ' + str(e)}), 500

# 创建默认应用实例（用于开发）
try:
    app = create_app()
except Exception as e:
    print(f"创建应用实例时出错: {str(e)}")
    import traceback
    traceback.print_exc()
    raise

if __name__ == '__main__':
    app.run(debug=True)