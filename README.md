# 个人主页项目

这是一个功能完整的个人主页全栈Web应用，用于展示个人信息、项目作品，并提供用户交互功能如注册、登录和留言。

## 项目结构

```
fullstack/
├── .gitignore              # Git忽略文件
├── .env.example           # 环境变量示例文件
├── README.md               # 项目说明文档
├── DEPLOYMENT_BT.md        # 宝塔面板部署指南
├── requirements.txt        # Python依赖声明
├── wsgi.py                # WSGI入口文件
├── backend/                # 后端代码目录
│   ├── __init__.py        # 包初始化文件
│   ├── app.py             # Flask主应用
│   ├── models.py          # 数据模型
│   ├── config.py          # 配置文件
│   └── utils.py           # 工具函数
└── frontend/               # 前端代码目录
    ├── build.js           # 构建脚本
    ├── home.html          # 首页
    ├── login.html         # 登录页
    ├── manifest.json      # Web应用清单文件
    ├── profile.html       # 个人资料页
    ├── register.html      # 注册页
    ├── sw.js              # Service Worker
    ├── css/               # 样式文件
    ├── js/                # JavaScript文件
    └── png/               # 图片资源
```

## 技术栈

### 前端
- HTML5
- CSS3
- JavaScript (ES6+)
- 原生JS（无框架）

### 后端
- Python 3.x
- Flask
- SQLAlchemy
- Redis
- MySQL

## 功能特性

- 响应式首页展示个人介绍、项目、联系方式等
- 用户注册与登录（支持用户名/邮箱）
- 图形验证码与邮箱验证码双重验证
- 密码强度校验（至少8位，含大小写、数字、特殊字符）
- 个人资料查看与编辑
- 留言板功能（用户留言，管理员可回复）
- 管理员后台管理留言与权限控制

## 安装与运行

### 环境要求
- Python 3.x
- MySQL数据库
- Redis缓存服务
- SMTP邮件服务

### 安装步骤

1. 克隆项目：
   ```bash
   git clone <repository-url>
   cd fullstack
   ```

2. 创建虚拟环境并激活：
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

4. 配置环境变量：
   复制 `.env.example` 文件为 `.env`，并配置数据库、Redis和邮件服务参数。

5. 初始化数据库：
   ```bash
   # 在Python shell中执行
   from backend.app import app, db
   with app.app_context():
       db.create_all()
   ```

6. 运行应用：
   ```bash
   python backend/app.py
   ```

## 部署

### 宝塔面板部署

参考 [DEPLOYMENT_BT.md](file:///e:/text/fullstack/DEPLOYMENT_BT.md) 文件了解如何在宝塔面板中部署该项目。

### 使用Gunicorn部署：
```bash
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

## 目录说明

### backend/
后端代码目录，包含Flask应用、数据模型和配置文件。

### frontend/
前端代码目录，包含HTML页面、CSS样式、JavaScript脚本和静态资源。

### requirements.txt
项目依赖列表。

### wsgi.py
WSGI入口文件，用于生产环境部署。

### .env.example
环境变量配置示例文件，包含数据库、Redis和邮件服务配置示例。

## 开发规范

- 遵循PEP8 Python编码规范
- 使用语义化版本控制
- 编写单元测试保证代码质量
- 使用Git进行版本管理
