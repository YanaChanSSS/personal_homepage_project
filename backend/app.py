from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from models import db, User, Message, DeveloperReply
import os
import random
import string
from datetime import datetime, timedelta
import redis
import json
# 添加邮件发送所需模块
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
# 添加PIL库用于生成复杂验证码
from PIL import Image, ImageDraw, ImageFont
import io
import base64
# 添加正则表达式模块
import re

app = Flask(__name__, template_folder='../frontend', static_folder='../frontend')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'your-secret_key_here'  # 部署时应使用强密钥
# MySQL数据库配置
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or \
    'mysql+pymysql://username:password@localhost/database_name'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 邮件配置
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME') or 'your-email@gmail.com'
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD') or 'your-email-password'
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER') or 'your-email@gmail.com'

# 初始化数据库
db.init_app(app)

# 初始化Redis连接
redis_client = redis.StrictRedis(
    host=os.environ.get('REDIS_HOST') or 'localhost',
    port=int(os.environ.get('REDIS_PORT') or 6379),
    db=int(os.environ.get('REDIS_DB') or 0),
    password=os.environ.get('REDIS_PASSWORD'),
    decode_responses=True
)

# 修改生成图形验证码函数，添加扭曲文字和干扰线
def generate_captcha():
    # 创建一个更复杂的验证码图片
    width, height = 120, 40
    image = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    
    # 生成随机字符
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    
    # 尝试使用系统字体，如果失败则使用默认字体
    try:
        # 在不同系统上尝试不同的字体路径
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',  # Linux
            '/System/Library/Fonts/Arial Bold.ttf',  # macOS
            'C:/Windows/Fonts/arialbd.ttf',  # Windows
        ]
        font = None
        for path in font_paths:
            try:
                font = ImageFont.truetype(path, 24)
                break
            except:
                continue
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # 绘制扭曲文字
    char_width = width // (len(chars) + 1)
    for i, char in enumerate(chars):
        # 随机位置和角度
        x = char_width * (i + 0.5) + random.randint(-5, 5)
        y = height // 2 + random.randint(-10, 10)
        angle = random.randint(-30, 30)
        
        # 创建单个字符图像并旋转
        char_img = Image.new('RGBA', (30, 30), (255, 255, 255, 0))
        char_draw = ImageDraw.Draw(char_img)
        char_draw.text((5, 5), char, font=font, fill=(random.randint(0, 100), random.randint(0, 100), random.randint(0, 100)))
        char_img = char_img.rotate(angle, expand=1)
        
        # 将字符粘贴到主图像上
        image.paste(char_img, (int(x - char_img.width // 2), int(y - char_img.height // 2)), char_img)
    
    # 添加干扰线
    for _ in range(5):
        x1 = random.randint(0, width)
        y1 = random.randint(0, height)
        x2 = random.randint(0, width)
        y2 = random.randint(0, height)
        draw.line([(x1, y1), (x2, y2)], fill=(random.randint(150, 255), random.randint(150, 255), random.randint(150, 255)), width=1)
    
    # 添加干扰点
    for _ in range(50):
        x = random.randint(0, width)
        y = random.randint(0, height)
        draw.point((x, y), fill=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)))
    
    # 添加噪点
    for _ in range(50):
        x = random.randint(0, width-2)
        y = random.randint(0, height-2)
        draw.rectangle([(x, y), (x+2, y+2)], fill=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)))
    
    # 将图片转换为base64编码
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return chars, img_str

# 生成邮箱验证码
def generate_email_code():
    return ''.join(random.choices(string.digits, k=6))

# 验证邮箱格式
def is_valid_email(email):
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# 发送邮件验证码
def send_email_code_via_smtp(email, code):
    try:
        # 创建邮件对象
        msg = MIMEMultipart()
        msg['From'] = Header(app.config['MAIL_DEFAULT_SENDER'])
        msg['To'] = Header(email)
        msg['Subject'] = Header('YanaChan个人主页 - 邮箱验证码', 'utf-8')
        
        # 邮件正文
        body = f'''
您好！

您正在注册YanaChan个人主页账户，验证码为：{code}

验证码5分钟内有效，请勿泄露给他人。

此邮件为系统自动发送，请勿回复。
        '''
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # 连接SMTP服务器并发送邮件
        server = smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT'])
        server.starttls()
        server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
        server.sendmail(app.config['MAIL_DEFAULT_SENDER'], email, msg.as_string())
        server.quit()
        
        return True
    except Exception as e:
        print(f"邮件发送失败: {e}")
        return False

@app.route('/')
def index():
    if 'username' in session:
        return render_template('home.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        # 支持用户名或邮箱登录
        if '@' in username:
            # 邮箱登录
            user = User.query.filter_by(email=username).first()
        else:
            # 用户名登录
            user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['username'] = user.username
            # 添加用户角色信息到会话
            session['role'] = user.role
            return jsonify({'success': True, 'message': '登录成功！', 'role': user.role})
        else:
            return jsonify({'success': False, 'message': '用户名/邮箱或密码错误'})
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirmPassword']
        captcha = request.form['captcha']
        email_code = request.form['emailCode']
        
        # 验证输入
        if not username or not email or not password or not confirm_password or not captcha or not email_code:
            return jsonify({'success': False, 'message': '请填写所有字段'})
        
        # 验证图形验证码
        # 从Redis获取存储的验证码
        stored_captcha = redis_client.get(f"captcha:{request.remote_addr}")
        if not stored_captcha or captcha.lower() != stored_captcha.lower():
            return jsonify({'success': False, 'message': '图形验证码错误'})
        
        # 验证邮箱验证码
        # 从Redis获取存储的验证码
        stored_email_code = redis_client.get(f"email_code:{email}")
        if not stored_email_code or stored_email_code != email_code:
            return jsonify({'success': False, 'message': '邮箱验证码错误'})
        
        # 检查邮箱验证码是否过期（通过检查键是否存在，因为设置了过期时间）
        if not redis_client.exists(f"email_code:{email}"):
            return jsonify({'success': False, 'message': '邮箱验证码已过期'})
        
        if password != confirm_password:
            return jsonify({'success': False, 'message': '两次输入的密码不一致'})
        
        # 添加密码强度验证
        password_error = validate_password_strength(password)
        if password_error:
            return jsonify({'success': False, 'message': password_error})
        
        # 验证邮箱格式
        if not is_valid_email(email):
            return jsonify({'success': False, 'message': '邮箱格式不正确'})
        
        # 检查用户名是否已存在
        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': '用户名已存在'})
        
        # 检查邮箱是否已存在
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': '邮箱已被注册'})
        
        # 创建新用户
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        # 清除已使用的验证码（删除Redis中的键）
        redis_client.delete(f"email_code:{email}")
        redis_client.delete(f"captcha:{request.remote_addr}")
        
        return jsonify({'success': True, 'message': '注册成功！'})
    
    return render_template('register.html')

# 生成图形验证码接口
@app.route('/captcha')
def captcha():
    # 添加频率限制：每个IP每分钟最多请求10次图形验证码
    client_ip = request.remote_addr
    captcha_limit_key = f"captcha_limit:{client_ip}"
    captcha_requests = redis_client.get(captcha_limit_key)
    
    if captcha_requests and int(captcha_requests) >= 10:
        return jsonify({'error': '请求过于频繁，请稍后再试'}), 429
    
    captcha_text, captcha_image = generate_captcha()
    # 将验证码存储在Redis中，设置5分钟过期时间
    redis_client.setex(f"captcha:{request.remote_addr}", 300, captcha_text)
    
    # 更新请求次数
    if captcha_requests:
        redis_client.incr(captcha_limit_key)
    else:
        redis_client.setex(captcha_limit_key, 60, 1)  # 60秒过期
        
    return jsonify({'captcha': captcha_image})

# 发送邮箱验证码接口
@app.route('/send_email_code', methods=['POST'])
def send_email_code():
    # 添加频率限制：每个邮箱每小时最多发送5次验证码，每个IP每小时最多发送20次
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'success': False, 'message': '请提供邮箱地址'})
    
    # IP频率限制
    client_ip = request.remote_addr
    email_code_ip_limit_key = f"email_code_ip_limit:{client_ip}"
    ip_requests = redis_client.get(email_code_ip_limit_key)
    
    if ip_requests and int(ip_requests) >= 20:
        return jsonify({'success': False, 'message': '请求过于频繁，请稍后再试'}), 429
    
    # 邮箱频率限制
    email_code_limit_key = f"email_code_limit:{email}"
    email_requests = redis_client.get(email_code_limit_key)
    
    if email_requests and int(email_requests) >= 5:
        return jsonify({'success': False, 'message': '请求过于频繁，请稍后再试'}), 429
    
    # 验证邮箱格式
    if not is_valid_email(email):
        return jsonify({'success': False, 'message': '邮箱格式不正确'})
    
    # 检查邮箱是否已被注册
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': '该邮箱已被注册'})
    
    # 生成邮箱验证码
    email_code = generate_email_code()
    
    # 存储验证码和过期时间（5分钟）到Redis
    redis_client.setex(f"email_code:{email}", 300, email_code)  # 300秒 = 5分钟
    
    # 更新请求次数
    if ip_requests:
        redis_client.incr(email_code_ip_limit_key)
    else:
        redis_client.setex(email_code_ip_limit_key, 3600, 1)  # 1小时过期
    
    if email_requests:
        redis_client.incr(email_code_limit_key)
    else:
        redis_client.setex(email_code_limit_key, 3600, 1)  # 1小时过期
    
    # 发送邮件验证码
    if send_email_code_via_smtp(email, email_code):
        return jsonify({'success': True, 'message': '验证码已发送到您的邮箱'})
    else:
        # 发送失败时清除验证码
        redis_client.delete(f"email_code:{email}")
        return jsonify({'success': False, 'message': '验证码发送失败，请稍后重试'})

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    user = User.query.filter_by(username=session['username']).first()
    
    if request.method == 'POST':
        # 更新用户信息
        user.email = request.form.get('email', user.email)
        user.bio = request.form.get('bio', user.bio)
        
        # 处理留言
        message_content = request.form.get('message')
        if message_content:
            message = Message(user_id=user.id, content=message_content)
            db.session.add(message)
        
        db.session.commit()
        return jsonify({'success': True, 'message': '信息保存成功！'})
    
    # 获取用户的留言
    messages = Message.query.filter_by(user_id=user.id).order_by(Message.created_at.desc()).all()
    
    return render_template('profile.html', user=user, messages=messages)

@app.route('/api/messages')
def api_messages():
    """获取留言的API接口 - 普通用户只能看到自己的留言及回复，管理员可以看到所有留言"""
    if 'username' not in session:
        return jsonify({'error': '未登录'}), 401
    
    # 获取当前用户
    current_user = User.query.filter_by(username=session['username']).first()
    if not current_user:
        return jsonify({'error': '用户不存在'}), 404
    
    # 根据用户角色查询留言
    if current_user.is_admin():
        # 管理员可以看到所有留言
        messages = Message.query.join(User).add_columns(
            User.username, 
            Message.content, 
            Message.created_at,
            Message.id
        ).order_by(Message.created_at.desc()).all()
    else:
        # 普通用户只能看到自己的留言
        messages = Message.query.join(User).add_columns(
            User.username, 
            Message.content, 
            Message.created_at,
            Message.id
        ).filter(Message.user_id == current_user.id).order_by(Message.created_at.desc()).all()
    
    # 获取每条留言的回复
    result = []
    for msg in messages:
        # 获取该留言的所有回复
        replies = DeveloperReply.query.filter_by(message_id=msg.id).join(User).add_columns(
            User.username,
            DeveloperReply.content,
            DeveloperReply.created_at
        ).order_by(DeveloperReply.created_at.asc()).all()
        
        result.append({
            'id': msg.id,
            'username': msg.username,
            'content': msg.content,
            'date': msg.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'replies': [{
                'developer': reply.username,
                'content': reply.content,
                'date': reply.created_at.strftime('%Y-%m-%d %H:%M:%S')
            } for reply in replies]
        })
    
    return jsonify(result)

# 添加开发者回复API端点
@app.route('/api/messages/<int:message_id>/reply', methods=['POST'])
def reply_to_message(message_id):
    """开发者回复留言"""
    if 'username' not in session:
        return jsonify({'success': False, 'message': '未登录'}), 401
    
    # 获取当前用户
    current_user = User.query.filter_by(username=session['username']).first()
    if not current_user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    # 检查用户是否为开发者/管理员
    if not current_user.is_admin():
        return jsonify({'success': False, 'message': '权限不足'}), 403
    
    # 获取留言
    message = Message.query.get_or_404(message_id)
    
    # 获取回复内容
    data = request.get_json()
    reply_content = data.get('content', '').strip()
    
    if not reply_content:
        return jsonify({'success': False, 'message': '回复内容不能为空'})
    
    # 创建回复
    reply = DeveloperReply(
        message_id=message.id,
        developer_id=current_user.id,
        content=reply_content
    )
    
    db.session.add(reply)
    db.session.commit()
    
    return jsonify({
        'success': True, 
        'message': '回复成功',
        'reply': {
            'developer': current_user.username,
            'content': reply_content,
            'date': reply.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    })

@app.route('/api/check_login')
def check_login():
    if 'username' in session:
        return jsonify({'logged_in': True, 'username': session['username'], 'role': session.get('role', 'user')})
    else:
        return jsonify({'logged_in': False})

@app.route('/api/user_info')
def user_info():
    if 'username' not in session:
        return jsonify({'error': '未登录'}), 401
    
    user = User.query.filter_by(username=session['username']).first()
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    return jsonify({
        'email': user.email,
        'bio': user.bio
    })

# 修改/logout路由以支持POST请求并返回JSON
@app.route('/logout', methods=['POST'])
def logout_api():
    session.pop('username', None)
    session.pop('role', None)
    return jsonify({'success': True, 'message': '您已退出登录'})

# 添加密码强度验证函数
def validate_password_strength(password):
    """
    验证密码强度
    要求：
    1. 长度至少8位
    2. 包含大写字母
    3. 包含小写字母
    4. 包含数字
    5. 包含特殊字符
    """
    if len(password) < 8:
        return "密码长度至少8位"
    
    # 确保函数内部可以使用re模块
    import re
    
    if not re.search(r"[A-Z]", password):
        return "密码必须包含至少一个大写字母"
    
    if not re.search(r"[a-z]", password):
        return "密码必须包含至少一个小写字母"
    
    if not re.search(r"\d", password):
        return "密码必须包含至少一个数字"
    
    # 与前端保持一致的特殊字符检查
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return "密码必须包含至少一个特殊字符(!@#$%^&*(),.?\":{}|<>)"
    
    # 检查是否包含常见弱密码
    weak_passwords = ['password', '12345678', 'qwertyui', 'admin1234']
    if password.lower() in weak_passwords:
        return "密码过于简单，请选择更复杂的密码"
    
    return None

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # 创建默认管理员账户
        admin_user = User.query.filter_by(username='YanaChan').first()
        if not admin_user:
            admin_user = User(
                username='YanaChan',
                email='2974691773@qq.com',
                role='admin'
            )
            admin_user.set_password('114514')
            db.session.add(admin_user)
            db.session.commit()
            print("默认管理员账户已创建")
        else:
            # 确保账户具有管理员权限
            if admin_user.role != 'admin':
                admin_user.role = 'admin'
                db.session.commit()
                print("已更新管理员账户权限")
    
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
