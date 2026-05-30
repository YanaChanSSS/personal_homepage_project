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
from flask_cors import CORS
from redis import Redis
import re
import json
import hashlib
from flask_mail import Mail, Message

from backend.config import config
from backend.models import db, User, Message as DbMessage
from backend.utils import generate_captcha, hash_email_code, validate_email


class AuthManager:
    """认证管理器"""
    
    def __init__(self, app):
        self.app = app
    
    def login(self):
        """
        处理用户登录请求
        
        支持JSON和表单两种数据格式
        Returns:
            JSON响应和HTTP状态码
        """
        try:
            # 支持 JSON 和表单两种格式
            if request.is_json:
                data = request.get_json()
                username = data.get('username', '').strip()
                password = data.get('password', '')
            else:
                username = request.form.get('username', '').strip()
                password = request.form.get('password', '')
            
            # 检查用户名和密码是否为空
            if not username or not password:
                return jsonify({'success': False, 'message': '用户名和密码不能为空'}), 400
            
            # 查找用户（可以是用户名或邮箱）
            user = User.query.filter(
                (User.username == username) | (User.email == username)
            ).first()
            
            # 检查用户是否存在且密码正确
            if user and user.check_password(password):
                # 登录成功，设置session
                session.permanent = True
                session['user_id'] = user.id
                session['username'] = user.username
                
                response_data = {
                    'success': True, 
                    'message': '登录成功',
                    'username': user.username,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                }
                
                return jsonify(response_data), 200
            else:
                return jsonify({'success': False, 'message': '用户名或密码错误'}), 401
                
        except Exception as e:
            error_info = traceback.format_exc()
            print(f"登录失败: {str(e)}")
            print(f"详细错误信息:\n{error_info}")
            # 提供更具体的错误信息
            if "connection" in str(e).lower() or "database" in str(e).lower():
                return jsonify({'success': False, 'message': '数据库连接失败，请检查数据库配置'}), 500
            elif "timeout" in str(e).lower():
                return jsonify({'success': False, 'message': '操作超时，请稍后重试'}), 500
            elif "authentication" in str(e).lower():
                return jsonify({'success': False, 'message': '身份验证失败，请检查用户名和密码'}), 500
            else:
                return jsonify({'success': False, 'message': '服务器内部错误'}), 500
    
    def check_auth(self):
        """
        检查用户认证状态
        
        Returns:
            JSON响应，包含用户登录状态和用户信息
        """
        # 检查session中是否存在用户ID
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user:
                response_data = {
                    'isLoggedIn': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                }
                
                return jsonify(response_data)
        # 用户未登录或session无效
        return jsonify({'isLoggedIn': False})
    
    def logout(self):
        """
        处理用户登出请求
        
        Returns:
            JSON响应，表示登出结果
        """
        try:
            # 清除session
            session.pop('user_id', None)
            session.pop('username', None)
            
            return jsonify({'success': True, 'message': '登出成功'})
        except Exception as e:
            error_info = traceback.format_exc()
            print(f"登出失败: {str(e)}")
            print(f"详细错误信息:\n{error_info}")
            return jsonify({'success': False, 'message': '服务器内部错误'}), 500


def create_app(config_name=None):
    """应用工厂函数"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'default')
    
    # 确保配置名称有效
    if config_name not in config:
        config_name = 'default'
    
    app = Flask(__name__,
                template_folder='../frontend',
                static_folder='../frontend',
                static_url_path='/frontend')
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 验证关键配置项
    if not app.config.get('SQLALCHEMY_DATABASE_URI') and not app.config.get('SQLALCHEMY_BINDS'):
        # 设置默认数据库URI作为兜底方案
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../personal_homepage.db'
        print("警告: 未设置数据库URI，使用默认SQLite数据库")
    
    # 确保设置了SECRET_KEY
    if not app.config.get('SECRET_KEY'):
        app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')  # 优先从环境变量获取
    
    # 配置会话 - 优先从环境变量读取，否则根据环境自动设置
    is_production = app.config.get('ENV') == 'production'
    session_cookie_secure = os.getenv('SESSION_COOKIE_SECURE', str(is_production)).lower() in ('true', '1', 'yes')
    session_cookie_samesite = os.getenv('SESSION_COOKIE_SAMESITE', 'None' if is_production else 'Lax')
    session_cookie_domain = os.getenv('SESSION_COOKIE_DOMAIN', None)
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,  # 防止XSS攻击
        SESSION_COOKIE_SAMESITE=session_cookie_samesite,
        PERMANENT_SESSION_LIFETIME=86400,  # 会话过期时间（秒）
        SESSION_COOKIE_SECURE=session_cookie_secure,
        SESSION_COOKIE_DOMAIN=session_cookie_domain
    )
    
    # 配置 CORS - 支持跨域访问和凭证传递
    CORS(app, 
         resources={"/*": {
             "origins": app.config['CORS_ORIGINS'],
             "supports_credentials": True,
             "allow_headers": ["Content-Type", "Authorization"],
             "expose_headers": ["Content-Disposition"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
         }})
    
    # 初始化扩展
    db.init_app(app)
    
    # 测试数据库连接
    try:
        with app.app_context():
            db.create_all()
            print("数据库表结构已创建或验证成功")
    except Exception as e:
        error_info = traceback.format_exc()
        print(f"数据库连接或表结构创建失败: {str(e)}")
        print(f"详细错误信息:\n{error_info}")
        # 即使数据库连接失败也继续启动应用
        pass
    
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
    
    # 构建Redis连接参数
    redis_config = {
        'host': redis_host,
        'port': redis_port,
        'db': redis_db,
        'password': redis_password,
        'decode_responses': True,
        'socket_connect_timeout': 5,
        'socket_timeout': 5
    }
    
    try:
        app.redis_client = Redis(**redis_config)
        # 测试Redis连接
        app.redis_client.ping()
        print(f"Redis连接成功: {redis_host}:{redis_port}, DB{redis_db}")
    except Exception as e:
        error_msg = f"Redis连接失败: {str(e)}"
        print(error_msg)
        # 记录详细的连接信息用于排查问题
        connection_info = f"尝试连接 Redis: {redis_host}:{redis_port}, DB{redis_db}"
        if redis_password:
            connection_info += " (已配置密码)"
        else:
            connection_info += " (无密码)"
        print(connection_info)
        # 即使Redis连接失败也继续启动应用
        app.redis_client = None
    
    # 初始化认证管理器
    auth_manager = AuthManager(app)
    app.auth_manager = auth_manager
    
    # 注册蓝图或路由
    register_routes(app, auth_manager)
    
    return app


def register_routes(app, auth_manager):
    """注册路由"""
    
    @app.route('/')
    def index():
        """首页"""
        return render_template('home.html')
    
    @app.route('/test_login.html')
    def test_login_page():
        """测试登录页面"""
        from flask import send_from_directory
        import os
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return send_from_directory(project_root, 'test_login.html')
    
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        """登录页面和登录处理"""
        if request.method == 'GET':
            return render_template('login.html')
        elif request.method == 'POST':
            return auth_manager.login()
    
    @app.route('/api/check_auth', methods=['GET'])
    def check_auth():
        """检查用户是否已登录"""
        return auth_manager.check_auth()

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        """注册页面和注册处理"""
        if request.method == 'GET':
            return render_template('register.html')

        # POST - 处理注册
        try:
            if request.is_json:
                data = request.get_json()
            else:
                data = request.form

            username = (data.get('username') or '').strip()
            email = (data.get('email') or '').strip()
            password = data.get('password') or ''
            confirm_password = data.get('confirmPassword') or data.get('confirm_password') or ''
            email_code = (data.get('emailCode') or data.get('email_code') or '').strip()

            # 基本字段验证
            if not all([username, email, password, confirm_password, email_code]):
                return jsonify({'success': False, 'message': '请填写所有字段'}), 400

            if len(username) < 3 or len(username) > 20:
                return jsonify({'success': False, 'message': '用户名需要3-20个字符'}), 400

            if not validate_email(email):
                return jsonify({'success': False, 'message': '邮箱格式不正确'}), 400

            if password != confirm_password:
                return jsonify({'success': False, 'message': '两次输入的密码不一致'}), 400

            # 密码强度校验
            valid, msg = validate_password_strength(password)
            if not valid:
                return jsonify({'success': False, 'message': msg}), 400

            # 检查用户名和邮箱唯一性
            if User.query.filter_by(username=username).first():
                return jsonify({'success': False, 'message': '用户名已存在'}), 409
            if User.query.filter_by(email=email).first():
                return jsonify({'success': False, 'message': '该邮箱已被注册'}), 409

            # 验证邮箱验证码
            if app.redis_client:
                stored_code = app.redis_client.get(f"email_code:{email}")
                if not stored_code or stored_code != email_code:
                    return jsonify({'success': False, 'message': '验证码错误或已过期'}), 400
                app.redis_client.delete(f"email_code:{email}")  # 验证成功后删除
            else:
                print(f"警告: Redis未连接，跳过验证码校验。邮箱 {email} 的验证码: {email_code}")

            # 创建用户
            user = User(username=username, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()

            return jsonify({'success': True, 'message': '注册成功'}), 201

        except Exception as e:
            db.session.rollback()
            error_info = traceback.format_exc()
            print(f"注册失败: {str(e)}")
            print(f"详细错误信息:\n{error_info}")
            return jsonify({'success': False, 'message': '注册失败，请稍后重试'}), 500
    
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
    
    @app.route('/api/logout', methods=['POST'])
    def logout():
        """用户登出API"""
        return auth_manager.logout()
    
    @app.route('/check_username', methods=['POST'])
    def check_username():
        """检查用户名是否已存在"""
        try:
            data = request.get_json()
            username = data.get('username', '')
            
            # 查询数据库中是否存在该用户名
            user = User.query.filter_by(username=username).first()
            
            response_data = {'exists': user is not None}
            response = jsonify(response_data)
            
            return response
        except Exception as e:
            print(f"检查用户名失败: {str(e)}")
            response_data = {'error': '服务器内部错误'}
            response = jsonify(response_data)
            response.status_code = 500
            
            return response, 500
    
    @app.route('/check_email', methods=['POST'])
    def check_email():
        """检查邮箱是否已存在"""
        try:
            data = request.get_json()
            email = data.get('email', '')
            
            # 查询数据库中是否存在该邮箱
            user = User.query.filter_by(email=email).first()
            
            response_data = {'exists': user is not None}
            response = jsonify(response_data)
            
            return response
        except Exception as e:
            print(f"检查邮箱失败: {str(e)}")
            response_data = {'error': '服务器内部错误'}
            response = jsonify(response_data)
            response.status_code = 500
            
            return response, 500
    
    @app.route('/api/check_login')
    def check_login():
        """检查登录状态"""
        print(f"检查登录状态，Session内容: {session}")
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user:
                response_data = {
                    'logged_in': True,
                    'isLoggedIn': True,
                    'username': user.username,
                    'is_admin': user.is_admin,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                }
                print(f"用户已登录: {response_data}")
                return jsonify(response_data)
        print("用户未登录")
        return jsonify({'logged_in': False, 'isLoggedIn': False})
    
    @app.route('/api/user_info')
    def user_info():
        """获取用户信息"""
        if 'user_id' not in session:
            response_data = {'error': '未登录'}
            response = jsonify(response_data)
            response.status_code = 401
            
            return response
        
        user = User.query.get(session['user_id'])
        if not user:
            response_data = {'error': '用户不存在'}
            response = jsonify(response_data)
            response.status_code = 404
            
            return response
        
        response_data = {
            'username': user.username,
            'email': user.email,
            'bio': user.bio,
            'is_admin': user.is_admin  # 添加管理员标识
        }
        response = jsonify(response_data)
        
        return response
    
    @app.route('/api/messages')
    def get_messages():
        """获取留言列表"""
        # 检查用户是否登录
        if 'user_id' not in session:
            response_data = {'error': '未登录'}
            response = jsonify(response_data)
            response.status_code = 401
            
            return response
        
        user = User.query.get(session['user_id'])
        if not user:
            response_data = {'error': '用户不存在'}
            response = jsonify(response_data)
            response.status_code = 404
            
            return response
            
        messages = DbMessage.query.order_by(DbMessage.created_at.desc()).all()
        result = []
        for msg in messages:
            result.append({
                'id': msg.id,
                'username': msg.username,
                'content': msg.content,
                'created_at': msg.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        response = jsonify(result)
        
        return response
    
    @app.route('/api/messages', methods=['POST'])
    def add_message():
        """添加留言"""
        # 检查用户是否登录
        if 'user_id' not in session:
            response_data = {'error': '未登录'}
            response = jsonify(response_data)
            response.status_code = 401
            
            return response
        
        user = User.query.get(session['user_id'])
        if not user:
            response_data = {'error': '用户不存在'}
            response = jsonify(response_data)
            response.status_code = 404
            
            return response
        
        try:
            data = request.get_json()
            content = data.get('content', '').strip()
            
            if not content:
                response_data = {'error': '留言内容不能为空'}
                response = jsonify(response_data)
                response.status_code = 400
                return response
            
            # 创建新留言
            message = DbMessage(username=user.username, content=content)
            db.session.add(message)
            db.session.commit()
            
            response_data = {
                'id': message.id,
                'username': message.username,
                'content': message.content,
                'created_at': message.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            response = jsonify(response_data)
            
            return response
        except Exception as e:
            db.session.rollback()
            error_info = traceback.format_exc()
            print(f"添加留言失败: {str(e)}")
            print(f"详细错误信息:\n{error_info}")
            response_data = {'error': '服务器内部错误'}
            response = jsonify(response_data)
            response.status_code = 500
            
            return response
    
    @app.route('/api/admin/messages/<int:message_id>', methods=['DELETE'])
    def delete_message(message_id):
        """删除留言（仅管理员）"""
        # 检查用户是否登录
        if 'user_id' not in session:
            response_data = {'error': '未登录'}
            response = jsonify(response_data)
            response.status_code = 401
            
            return response
        
        user = User.query.get(session['user_id'])
        if not user:
            response_data = {'error': '用户不存在'}
            response = jsonify(response_data)
            response.status_code = 404
            
            return response
        
        # 检查是否为管理员
        if not user.is_admin:
            response_data = {'error': '权限不足'}
            response = jsonify(response_data)
            response.status_code = 403
            
            return response
        
        try:
            message = DbMessage.query.get(message_id)
            if not message:
                response_data = {'error': '留言不存在'}
                response = jsonify(response_data)
                response.status_code = 404
                return response
            
            db.session.delete(message)
            db.session.commit()
            
            response_data = {'success': True}
            response = jsonify(response_data)
            
            return response
        except Exception as e:
            db.session.rollback()
            error_info = traceback.format_exc()
            print(f"删除留言失败: {str(e)}")
            print(f"详细错误信息:\n{error_info}")
            response_data = {'error': '服务器内部错误'}
            response = jsonify(response_data)
            response.status_code = 500
            
            return response