import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    """基础配置类"""
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-string'
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if not SQLALCHEMY_DATABASE_URI:
        # 从 MySQL 组件构建连接字符串
        _host = os.environ.get('MYSQL_HOST', 'localhost')
        _port = os.environ.get('MYSQL_PORT', '3306')
        _user = os.environ.get('MYSQL_USER', 'root')
        _pass = os.environ.get('MYSQL_PASSWORD', '')
        _db = os.environ.get('MYSQL_DB', 'personal_homepage')
        SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{_user}:{_pass}@{_host}:{_port}/{_db}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis配置
    REDIS_HOST = os.environ.get('REDIS_HOST') or 'localhost'
    REDIS_PORT = int(os.environ.get('REDIS_PORT') or 6379)
    REDIS_DB = int(os.environ.get('REDIS_DB') or 0)
    REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD') or None
    
    # 邮件配置
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.qq.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # CORS配置
    CORS_ORIGINS = [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://yanachan.top',
        'http://www.yanachan.top',
        'https://yanachan.top',
        'https://www.yanachan.top'
    ]
    
    @staticmethod
    def build_redis_url(password=None, host=None, port=None, db=None):
        """构建Redis连接URL"""
        password = password or Config.REDIS_PASSWORD
        host = host or Config.REDIS_HOST
        port = port or Config.REDIS_PORT
        db = db or Config.REDIS_DB
        
        if password:
            return f"redis://:{password}@{host}:{port}/{db}"
        return f"redis://{host}:{port}/{db}"


class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    ENV = 'development'
    
    # 开发环境允许所有来源
    CORS_ORIGINS = [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost',
        'http://127.0.0.1',
        'https://yanachan.top',
        'https://www.yanachan.top',
        'http://yanachan.top',
        'http://www.yanachan.top'
    ]


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    ENV = 'production'
    
    # 生产环境配置应该从环境变量中获取
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    REDIS_HOST = os.environ.get('REDIS_HOST')
    REDIS_PORT = int(os.environ.get('REDIS_PORT') or 6379)
    REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD')
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # 生产环境的CORS来源应该明确指定
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else [
        'https://yanachan.top',
        'https://www.yanachan.top',
        'http://yanachan.top',
        'http://www.yanachan.top'
    ]


class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    WTF_CSRF_ENABLED = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}