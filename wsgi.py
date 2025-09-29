#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
WSGI入口文件
用于生产环境部署
"""

import sys
import os

# 将项目根目录添加到Python路径中
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# 从personal_homepage_project目录导入应用
sys.path.insert(0, os.path.join(project_root, 'personal_homepage_project'))

from personal_homepage_project.backend.app import create_app

# 创建应用实例
app = create_app(os.getenv('FLASK_ENV') or 'production')

if __name__ == "__main__":
    app.run()