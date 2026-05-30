# 个人主页

一个功能完整的个人主页全栈应用，支持用户注册登录、个人资料管理和留言互动。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5, CSS3, JavaScript (ES6+ Modules), Service Worker |
| 后端 | Python 3.8+, Flask, SQLAlchemy |
| 数据库 | MySQL, Redis |
| 部署 | Gunicorn, Nginx 反向代理 |

前端使用原生 JS 模块化开发，无框架依赖。

## 功能特性

- 响应式个人主页，含项目展示、联系方式等模块
- 用户注册与登录（支持用户名/邮箱登录）
- Session 认证，登录状态持久化
- 个人资料查看与编辑
- 留言板（用户留言，管理员回复）
- 移动端适配，独立分页导航

## 项目结构

```
├── backend/                 # 后端
│   ├── __init__.py
│   ├── app.py              # Flask 主应用 (路由、会话配置)
│   ├── auth.py             # 认证逻辑
│   ├── config.py           # 配置管理
│   ├── models.py           # 数据模型 (User, Message)
│   └── utils.py            # 工具函数
├── frontend/               # 前端
│   ├── home.html           # 首页
│   ├── login.html          # 登录页
│   ├── register.html       # 注册页
│   ├── profile.html        # 个人资料页
│   ├── css/                # 样式
│   ├── js/                 # JS 模块
│   │   ├── api.js          # API 客户端
│   │   ├── auth.js         # 认证检查
│   │   ├── store.js        # 前端状态管理
│   │   ├── router.js       # 路由
│   │   ├── home.js         # 首页逻辑
│   │   ├── login.js        # 登录逻辑
│   │   ├── main.js         # 应用入口
│   │   ├── components.js   # UI 组件
│   │   ├── events.js       # 事件处理
│   │   ├── i18n.js         # 国际化
│   │   ├── utils.js        # 工具函数
│   │   └── validator.js    # 表单校验
│   ├── png/                # 图片资源
│   ├── sw.js               # Service Worker
│   └── manifest.json        # PWA 清单
├── wsgi.py                 # WSGI 入口
├── gunicorn_conf.py        # Gunicorn 配置
├── nginx_bt_config.conf    # Nginx 参考配置
├── start.sh                # 启动脚本
├── create_admin.py         # 创建管理员脚本
├── requirements.txt        # Python 依赖
├── .env.example            # 环境变量示例
├── DEPLOYMENT_BT.md        # 宝塔面板部署指南
└── README.md
```

## 快速开始

### 环境要求

- Python 3.8+
- MySQL 5.7+
- Redis 5.0+

### 本地开发

```bash
# 1. 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库和 Redis 连接信息

# 4. 启动开发服务器
python wsgi.py
```

访问 `http://localhost:5000`。

### 生产部署

使用 Gunicorn + Nginx：

```bash
gunicorn -c gunicorn_conf.py wsgi:app
```

宝塔面板部署请参阅 [DEPLOYMENT_BT.md](DEPLOYMENT_BT.md)。

## 配置说明

`.env` 文件核心配置项：

```env
FLASK_ENV=production              # 运行环境
SECRET_KEY=<随机密钥>              # Flask Session 签名密钥
DATABASE_URL=mysql+pymysql://...  # MySQL 连接串
REDIS_HOST=localhost              # Redis 地址
REDIS_PORT=6379                   # Redis 端口
SESSION_COOKIE_SECURE=True        # HTTPS 下启用安全 Cookie
SESSION_COOKIE_SAMESITE=Lax       # 同站策略
SESSION_COOKIE_DOMAIN=.example.com # 域名（按需配置）
```

## API 概览

| 路由 | 方法 | 说明 |
|------|------|------|
| `/`, `/home` | GET | 首页 |
| `/login` | GET, POST | 登录 |
| `/register` | GET, POST | 注册 |
| `/logout` | POST | 登出 |
| `/profile` | GET, POST | 个人资料 |
| `/api/check_auth` | GET | 检查认证状态 |
| `/api/check_login` | GET | 检查登录状态 |
| `/api/messages` | GET, POST | 留言 |
| `/api/user_info` | GET | 用户信息 |

## License

MIT
