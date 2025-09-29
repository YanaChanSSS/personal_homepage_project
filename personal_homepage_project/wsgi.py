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

from backend.app import create_app

# 创建应用实例
app = create_app(os.getenv('FLASK_ENV') or 'production')

if __name__ == "__main__":
    app.run()