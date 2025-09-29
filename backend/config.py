import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    """基础配置类"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-for-development-only'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis配置
    REDIS_HOST = os.environ.get('REDIS_HOST') or 'localhost'
    REDIS_PORT = os.environ.get('REDIS_PORT') or 6379
    REDIS_DB = os.environ.get('REDIS_DB') or 0
    REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD') or None

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    # MySQL数据库配置
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
    MYSQL_PORT = os.environ.get('MYSQL_PORT') or '3306'
    MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or ''
    MYSQL_DB = os.environ.get('MYSQL_DB') or 'homepage_db'
    
    # 构建数据库URI
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    
    # Redis连接
    REDIS_URL = f"redis://{(':' + REDIS_PASSWORD + '@') if REDIS_PASSWORD else ''}{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    # 从环境变量获取数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f"mysql+pymysql://{os.environ.get('MYSQL_USER', 'user')}:{os.environ.get('MYSQL_PASSWORD', 'password')}@{os.environ.get('MYSQL_HOST', 'localhost')}/{os.environ.get('MYSQL_DB', 'dbname')}"
    
    # Redis连接
    REDIS_URL = os.environ.get('REDIS_URL') or \
        f"redis://{(':' + REDIS_PASSWORD + '@') if REDIS_PASSWORD else ''}{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}