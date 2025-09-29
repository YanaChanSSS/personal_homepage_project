# 个人主页项目

这是一个功能完整的个人主页全栈Web应用，用于展示个人信息、项目作品，并提供用户交互功能如注册、登录和留言。

## 项目结构

```
personal_homepage_project/
├── backend/                 # 后端代码
│   ├── __init__.py         # 包初始化文件
│   ├── app.py              # Flask主应用
│   ├── models.py           # 数据模型
│   ├── config.py           # 配置文件
│   └── utils.py            # 后端工具函数
├── frontend/               # 前端代码
│   ├── assets/             # 静态资源
│   │   └── images/         # 图片资源
│   ├── components/          # 可复用的HTML组件
│   ├── css/                # 样式文件
│   ├── js/                 # JavaScript文件
│   ├── pages/              # HTML页面
│   └── ...                 # 其他前端文件
├── docs/                   # 文档
├── tests/                  # 测试文件
├── requirements.txt        # Python依赖
├── wsgi.py                 # WSGI入口
├── .env                    # 环境变量配置
├── .gitignore              # Git忽略文件
└── README.md               # 项目说明
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
   cd personal_homepage_project
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
   编辑 `.env` 文件，配置数据库、Redis和邮件服务参数。

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

## 宝塔面板部署

### 环境准备
1. 在宝塔面板中安装以下软件：
   - Nginx
   - MySQL
   - Python项目管理器
   - Redis（可以通过宝塔面板直接安装或使用云Redis服务）

2. 创建网站和数据库：
   - 在宝塔面板中添加站点
   - 创建MySQL数据库和用户

### 部署步骤

1. 上传项目代码到服务器目录（如 `/www/wwwroot/personal_homepage_project`）

2. 在宝塔面板的Python项目管理器中添加项目：
   - 项目路径：`/www/wwwroot/personal_homepage_project`
   - 启动文件：`wsgi.py`
   - 启动对象：`app`
   - Python版本：选择Python 3.x版本
   - 虚拟环境：创建新的虚拟环境或使用现有的
   - 项目名称：`personal_homepage_project`

3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

4. 配置环境变量：
   在宝塔面板Python项目中配置环境变量，或修改 `.env` 文件：
   ```bash
   FLASK_ENV=production
   SECRET_KEY=your_production_secret_key
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=your_database_user
   MYSQL_PASSWORD=your_database_password
   MYSQL_DB=your_database_name
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

5. 初始化数据库：
   ```bash
   python -c "from backend.app import app, db; with app.app_context(): db.create_all()"
   ```

6. 配置Nginx反向代理：
   在宝塔面板中网站设置的反向代理中添加：
   - 代理名称：`flask_app`
   - 目标URL：`http://127.0.0.1:5000`（或你在Python项目中配置的端口）
   - 启用反向代理

7. 启动项目：
   在宝塔面板Python项目管理器中启动项目

### 注意事项
- 确保防火墙开放了相关端口
- 生产环境中务必修改SECRET_KEY
- 配置正确的数据库连接信息
- 邮件服务配置（如使用Gmail，需要开启两步验证并使用应用专用密码）

## 部署

使用Gunicorn部署：
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

### .env
环境变量配置文件，包含数据库、Redis和邮件服务配置。

## 开发规范

- 遵循PEP8 Python编码规范
- 使用语义化版本控制
- 编写单元测试保证代码质量
- 使用Git进行版本管理