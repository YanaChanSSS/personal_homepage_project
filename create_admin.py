#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建管理员账户脚本
"""
from backend.app import create_app
from backend.models import db, User

def create_admin():
    """创建管理员账户"""
    app = create_app('production')
    
    with app.app_context():
        # 获取管理员信息
        username = input("请输入管理员用户名: ").strip()
        email = input("请输入管理员邮箱: ").strip()
        password = input("请输入管理员密码: ").strip()
        
        # 检查用户名是否已存在
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"错误: 用户名 '{username}' 已存在！")
            return
        
        # 检查邮箱是否已存在
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            print(f"错误: 邮箱 '{email}' 已被使用！")
            return
        
        # 创建管理员用户
        admin = User(
            username=username,
            email=email,
            is_admin=True
        )
        admin.set_password(password)
        
        try:
            db.session.add(admin)
            db.session.commit()
            print(f"\n✓ 管理员账户创建成功！")
            print(f"  用户名: {username}")
            print(f"  邮箱: {email}")
            print(f"  管理员权限: 是")
        except Exception as e:
            db.session.rollback()
            print(f"\n✗ 创建失败: {str(e)}")

if __name__ == '__main__':
    create_admin()
