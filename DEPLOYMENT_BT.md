# 宝塔面板部署指南

本文档详细介绍了如何在宝塔Linux面板上部署个人主页项目。

## 一、环境准备

1. 在宝塔面板中安装以下软件：
   - Nginx (推荐版本1.18以上)
   - MySQL (推荐版本5.7或8.0)
   - Python (推荐版本3.8以上)
   - Redis (推荐版本5.0以上)

## 二、项目部署步骤

### 1. 创建网站

在宝塔面板中：
- 进入「网站」->「添加站点」
- 域名填写你的域名或使用服务器IP
- 备注填写"个人主页"
- PHP版本选择纯静态（我们使用Python而不是PHP）
- FTP和数据库可根据需要创建

### 2. 上传项目文件

将项目文件上传到网站目录（通常是 `/www/wwwroot/你的域名`）：
- 可以使用宝塔面板的文件管理器上传
- 或者使用Git在服务器上克隆项目
- 确保项目目录结构完整

### 3. 创建Python项目

在宝塔面板中：
- 进入「软件商店」->「Python项目管理器」
- 点击「添加项目」
- 项目路径选择你的网站目录
- 启动文件选择 `wsgi.py`
- 项目格式选择 `Flask`
- 项目名称自定义，如"个人主页"
- Python版本选择3.8以上
- 创建虚拟环境，名称如 `homepage_venv`

### 4. 安装依赖

在Python项目管理器中：
- 找到刚刚创建的项目
- 点击「依赖管理」
- 选择「从文件导入」
- 选择项目目录下的 `requirements.txt` 文件
- 点击「安装」等待依赖安装完成

或者在终端中执行：
```bash
cd /www/wwwroot/你的域名
source /www/wwwroot/你的域名/venv/bin/activate
pip install -r requirements.txt
```

### 5. 配置环境变量

在项目目录创建 `.env` 文件，配置以下内容：
```env
# Flask配置
FLASK_ENV=production
SECRET_KEY=你的随机密钥

# 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=数据库用户名
MYSQL_PASSWORD=数据库密码
MYSQL_DB=数据库名

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=如有设置则填写

# 邮件配置（如果需要）
MAIL_SERVER=smtp.mxhichina.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=你的邮箱
MAIL_PASSWORD=邮箱授权码
```

### 6. 初始化数据库

进入宝塔面板的终端或SSH工具，执行以下命令：

```bash
cd /www/wwwroot/你的域名
source /www/wwwroot/你的域名/venv/bin/activate
python
```

在Python交互环境中执行：
```python
from backend.app import create_app
from backend.models import db

app = create_app('production')
with app.app_context():
    db.create_all()
```

或者创建一个初始化脚本。

### 7. 配置Gunicorn

在Python项目管理器中：
- 编辑项目配置
- 启动命令改为：
```bash
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```
- 端口选择5000或其他未使用的端口
- 点击保存并重启项目

### 8. 配置Nginx反向代理

在宝塔面板的网站设置中：
- 点击对应网站的「设置」
- 选择「反向代理」
- 点击「添加反向代理」
- 代理名称：flask_app
- 目标URL：http://127.0.0.1:5000
- 发送域名：$host
- 点击「提交」

### 9. 配置域名和SSL（可选）

- 在网站设置中绑定你的域名
- 申请并部署SSL证书以启用HTTPS

## 三、常见问题及解决方案

### 1. 502 Bad Gateway错误

可能原因及解决方案：
- Flask应用未成功启动：检查Python项目管理器中的项目状态
- 端口冲突：检查Gunicorn配置的端口是否被占用
- Nginx配置错误：检查反向代理的目标URL是否正确

### 2. 静态文件无法加载

确保在Flask应用中正确配置了静态文件目录：
```python
app = Flask(__name__,
            template_folder='../frontend',
            static_folder='../frontend',
            static_url_path='')
```

### 3. 数据库连接失败

检查：
- `.env` 文件中的数据库配置是否正确
- MySQL服务是否正常运行
- 数据库用户是否有足够的权限
- 防火墙是否允许本地连接

### 4. Redis连接失败

检查：
- Redis服务是否启动
- `.env` 文件中的Redis配置是否正确
- 如设置了密码，确认密码是否正确

## 四、日常维护

### 查看日志

- 在宝塔面板的Python项目管理器中可以查看应用日志
- Nginx错误日志可以在网站设置中找到
- MySQL和Redis日志可以在对应的软件设置中查看

### 重启服务

当修改代码后需要重启服务：
- 重启Python项目（Flask应用）
- 如有必要，重启Nginx

### 更新代码

- 通过Git拉取最新代码：`git pull`
- 安装新依赖（如果有）：`pip install -r requirements.txt`
- 重启Python项目