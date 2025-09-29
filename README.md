# 个人主页项目

欢迎来到我的个人主页项目！这是一个全栈Web应用程序，展示了我的个人信息、项目作品，并提供了用户注册、登录、留言等功能。

## 项目概述

这是一个功能完整的个人主页网站，包含以下特性：
- 响应式设计，适配桌面端和移动端
- 用户注册、登录和身份验证系统
- 个人资料管理
- 留言板系统（用户可留言，管理员可回复）
- 邮箱验证和密码强度检查

## 技术栈

### 前端技术
- HTML5
- CSS3
- JavaScript (ES6+)
- 原生 JavaScript (无框架依赖)

### 后端技术
- Python 3.x
- Flask (Web 框架)
- SQLAlchemy (ORM)
- Redis (验证码存储)
- MySQL (主数据库)

### 第三方服务
- SMTP 邮件服务 (用于发送验证码)
- PIL (Python Imaging Library，用于生成验证码图片)

## 功能模块

### 1. 首页 (home.html)
- 个人介绍
- 项目展示
- 联系方式
- 公告和游戏账号信息

### 2. 用户系统
#### 登录 (login.html)
- 支持用户名或邮箱登录
- 密码加密验证

#### 注册 (register.html)
- 用户名和邮箱验证
- 图形验证码 (CAPTCHA)
- 邮箱验证码
- 密码强度检查 (至少8位，包含大小写字母、数字和特殊字符)

#### 个人资料 (profile.html)
- 查看和编辑个人信息
- 留言功能
- 查看历史留言和回复

### 3. 管理系统
- 管理员可查看所有用户留言
- 管理员可回复用户留言
- 角色权限控制

## 部署说明

### 宝塔面板部署步骤

1. 在宝塔面板中创建网站，选择Python项目类型
2. 将此项目上传到网站目录
3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
4. 配置环境变量（在宝塔面板的网站设置中配置，或创建.env文件）：
   - SECRET_KEY: 你的应用密钥
   - MYSQL_HOST: 数据库主机地址
   - MYSQL_PORT: 数据库端口
   - MYSQL_USER: 数据库用户名
   - MYSQL_PASSWORD: 数据库密码
   - MYSQL_DB: 数据库名称
   - REDIS_HOST: Redis主机地址
   - REDIS_PORT: Redis端口
   - REDIS_PASSWORD: Redis密码（如果有的话）

5. 在宝塔面板中设置项目启动方式：
   - 项目目录：选择项目根目录
   - 启动文件：wsgi.py
   - 启动对象：app

6. 启动项目并访问网站

### 手动部署

1. 克隆或下载项目代码
2. 创建虚拟环境：
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # 或
   venv\Scripts\activate     # Windows
   ```
3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
4. 配置环境变量（创建 .env 文件，参考 .env.example）
5. 初始化数据库：
   ```bash
   python -c "from personal_homepage_project.backend.app import create_app, db; app=create_app(); app.app_context().push(); db.create_all()"
   ```
6. 启动应用：
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
   ```

## 环境变量配置

参考 [.env.example](.env.example) 文件创建你的环境配置文件。
