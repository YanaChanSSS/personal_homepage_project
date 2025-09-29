// 前端资源构建脚本
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 配置
const config = {
  srcDir: '.',
  distDir: './dist',
  assets: {
    js: ['./js/*.js'],
    css: ['./css/*.css'],
    html: ['./*.html'],
    images: ['./images/*', './png/*']
  }
};

// 创建目录
function createDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 计算文件hash
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex').substring(0, 10);
}

// 压缩CSS
function minifyCSS(css) {
  return css
    .replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/;\s*}/g, '}')
    .replace(/:\s+/g, ':')
    .replace(/,\s/g, ',')
    .trim();
}

// 压缩JavaScript
function minifyJS(js) {
  return js
    .replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/;\s*}/g, '}')
    .replace(/:\s+/g, ':')
    .replace(/,\s/g, ',')
    .trim();
}

// 处理HTML文件
function processHTML(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 添加资源版本号
  const cssRegex = /<link[^>]*href=["']([^"']*\.css)["'][^>]*>/g;
  content = content.replace(cssRegex, (match, href) => {
    if (href.startsWith('http') || href.startsWith('//')) {
      return match;
    }
    
    const fullPath = path.join(path.dirname(filePath), href);
    if (fs.existsSync(fullPath)) {
      const hash = getFileHash(fullPath);
      return match.replace(href, `${href}?v=${hash}`);
    }
    return match;
  });
  
  const jsRegex = /<script[^>]*src=["']([^"']*\.js)["'][^>]*>/g;
  content = content.replace(jsRegex, (match, src) => {
    if (src.startsWith('http') || src.startsWith('//')) {
      return match;
    }
    
    const fullPath = path.join(path.dirname(filePath), src);
    if (fs.existsSync(fullPath)) {
      const hash = getFileHash(fullPath);
      return match.replace(src, `${src}?v=${hash}`);
    }
    return match;
  });
  
  return content;
}

// 处理CSS文件
function processCSS(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 处理相对路径
  const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
  content = content.replace(urlRegex, (match, url) => {
    if (url.startsWith('http') || url.startsWith('data:')) {
      return match;
    }
    
    return match;
  });
  
  return minifyCSS(content);
}

// 处理JavaScript文件
function processJS(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  return minifyJS(content);
}

// 复制文件
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

// 构建项目
function build() {
  console.log('开始构建项目...');
  
  // 创建输出目录
  createDir(config.distDir);
  
  // 复制HTML文件
  const htmlFiles = fs.readdirSync(config.srcDir).filter(f => f.endsWith('.html'));
  htmlFiles.forEach(file => {
    const srcPath = path.join(config.srcDir, file);
    const destPath = path.join(config.distDir, file);
    const processedContent = processHTML(srcPath);
    fs.writeFileSync(destPath, processedContent);
    console.log(`处理HTML文件: ${file}`);
  });
  
  // 复制和处理CSS文件
  createDir(path.join(config.distDir, 'css'));
  const cssFiles = fs.readdirSync('./css').filter(f => f.endsWith('.css'));
  cssFiles.forEach(file => {
    const srcPath = path.join('./css', file);
    const destPath = path.join(config.distDir, 'css', file);
    const processedContent = processCSS(srcPath);
    fs.writeFileSync(destPath, processedContent);
    console.log(`处理CSS文件: ${file}`);
  });
  
  // 复制和处理JS文件
  createDir(path.join(config.distDir, 'js'));
  const jsFiles = fs.readdirSync('./js').filter(f => f.endsWith('.js'));
  jsFiles.forEach(file => {
    const srcPath = path.join('./js', file);
    const destPath = path.join(config.distDir, 'js', file);
    const processedContent = processJS(srcPath);
    fs.writeFileSync(destPath, processedContent);
    console.log(`处理JS文件: ${file}`);
  });
  
  // 复制图片文件
  createDir(path.join(config.distDir, 'images'));
  if (fs.existsSync('./images')) {
    const imageFiles = fs.readdirSync('./images');
    imageFiles.forEach(file => {
      const srcPath = path.join('./images', file);
      const destPath = path.join(config.distDir, 'images', file);
      copyFile(srcPath, destPath);
      console.log(`复制图片文件: ${file}`);
    });
  }
  
  createDir(path.join(config.distDir, 'png'));
  if (fs.existsSync('./png')) {
    const pngFiles = fs.readdirSync('./png');
    pngFiles.forEach(file => {
      const srcPath = path.join('./png', file);
      const destPath = path.join(config.distDir, 'png', file);
      copyFile(srcPath, destPath);
      console.log(`复制PNG文件: ${file}`);
    });
  }
  
  // 复制其他重要文件
  const otherFiles = ['manifest.json', 'sw.js'];
  otherFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const srcPath = path.join(config.srcDir, file);
      const destPath = path.join(config.distDir, file);
      copyFile(srcPath, destPath);
      console.log(`复制文件: ${file}`);
    }
  });
  
  console.log('构建完成!');
}

// 运行构建
build();