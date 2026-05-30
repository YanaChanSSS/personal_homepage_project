#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
WSGI入口文件
用于生产环境部署
"""

import sys
import os
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv

# 配置基础日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler('app.log', maxBytes=1024*1024, backupCount=5)
    ]
)
logger = logging.getLogger(__name__)

try:
    # 将项目根目录添加到Python路径中
    project_root = os.path.dirname(os.path.abspath(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    # 在检查任何环境变量之前先加载 .env 文件
    env_file = os.path.join(project_root, '.env')
    if os.path.exists(env_file):
        load_dotenv(env_file, override=True)
        logger.info(f"已加载环境变量文件: {env_file}")
    else:
        logger.warning(f"未找到环境变量文件: {env_file}")

    logger.info(f"项目根目录: {project_root}")
    logger.info(f"Python路径: {sys.path}")

    # 检查环境变量
    env = os.getenv('FLASK_ENV', 'production')
    database_url = os.getenv('DATABASE_URL')
    logger.info(f"环境变量 FLASK_ENV: {env}")
    logger.info(f"环境变量 DATABASE_URL: {database_url}")

    # 如果没有设置DATABASE_URL，从MySQL组件构建
    if not database_url:
        mysql_host = os.getenv('MYSQL_HOST', 'localhost')
        mysql_port = os.getenv('MYSQL_PORT', '3306')
        mysql_user = os.getenv('MYSQL_USER', 'root')
        mysql_password = os.getenv('MYSQL_PASSWORD', '')
        mysql_db = os.getenv('MYSQL_DB', 'personal_homepage')
        database_url = f'mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}'
        logger.info(f"从MySQL组件构建 DATABASE_URL: mysql+pymysql://{mysql_user}:***@{mysql_host}:{mysql_port}/{mysql_db}")
        os.environ['DATABASE_URL'] = database_url

    # 导入应用工厂函数
    from backend.app import create_app

    # 创建应用实例
    logger.info(f"正在创建应用实例，环境: {env}")
    
    app = create_app(env)
    logger.info("应用实例创建成功")

except Exception as e:
    logger.critical("创建应用时发生错误", exc_info=True)
    raise

if __name__ == "__main__":
    try:
        logger.info("启动开发服务器...")
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.critical("启动开发服务器时发生错误", exc_info=True)
        raise