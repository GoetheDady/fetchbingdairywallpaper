# Bing 每日壁纸获取项目

这是一个基于 Node.js + Express 的项目，用于自动获取 Bing 每日壁纸，并提供图片处理功能。

## 功能特性

- 🖼️ 自动获取 Bing 每日壁纸（UHD 超高清）
- ⏰ 定时任务自动执行
  - 每 3 分钟获取最新壁纸
  - 每 10 分钟清理图片缓存
- 🎨 强大的图片处理功能（基于 Sharp）
  - 自定义尺寸调整
  - 多种格式转换（JPG、PNG、WebP、AVIF）
  - 多种缩放模式（cover、contain、fill 等）
- 💾 智能缓存管理
  - 相同参数的图片自动缓存
  - 定时清理过期缓存
- 📦 本地文件存储
  - 自动管理，只保留当天壁纸

## 项目结构

```
fetchBingDairyWallPaper/
├── src/
│   ├── app.js                        # Express 应用主文件
│   ├── routes/
│   │   └── index.js                  # 路由定义
│   ├── controllers/
│   │   ├── wallpaperController.js    # 壁纸控制器
│   │   └── imageController.js        # 图片处理控制器
│   ├── services/
│   │   ├── wallpaperService.js       # 壁纸业务逻辑
│   │   └── imageProcessService.js    # 图片处理业务逻辑
│   └── jobs/
│       └── scheduler.js              # 定时任务
├── images/                           # 原始壁纸存储目录
│   └── YYYYMMDD_UHD.jpg             # 当天的壁纸
├── processed/                        # 处理后图片缓存目录
│   └── wallpaper_*.*                # 缓存的处理图片
├── data/                             # 数据存储目录
├── .gitignore                        # Git 忽略文件
├── package.json                      # 项目依赖
└── README.md                         # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动项目

**开发模式**（使用 nodemon 自动重启）：
```bash
npm run dev
```

**生产模式**：
```bash
npm start
```

### 3. 访问服务

服务默认运行在 `http://localhost:3000`

## API 接口文档

### 1. 健康检查

检查服务是否正常运行。

**接口地址：**
```
GET /health
```

**响应示例：**
```json
{
  "status": "ok",
  "message": "服务运行正常",
  "timestamp": "2025-12-10T08:00:00.000Z"
}
```

---

### 2. 获取 Bing 壁纸数据

从 Bing API 获取壁纸信息并自动下载到本地。

**接口地址：**
```
GET /api/wallpaper
```

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| format | string | 否 | js | 返回格式 |
| idx | number | 否 | 0 | 开始索引 |
| n | number | 否 | 1 | 获取数量 |
| mkt | string | 否 | zh-CN | 市场地区 |

**使用示例：**

```bash
# 使用默认参数
curl http://localhost:3000/api/wallpaper

# 获取美国市场的壁纸
curl "http://localhost:3000/api/wallpaper?mkt=en-US"

# 获取最近 5 天的壁纸数据
curl "http://localhost:3000/api/wallpaper?n=5"
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取壁纸成功",
  "data": {
    "apiData": {
      "images": [
        {
          "startdate": "20251209",
          "url": "/th?id=OHR.CordobaCathedral_ZH-CN4603063077_1920x1080.jpg",
          "urlbase": "/th?id=OHR.CordobaCathedral_ZH-CN4603063077",
          "copyright": "科尔多瓦清真寺大教堂的内部，安达卢西亚，西班牙",
          "title": "文化交汇之地"
        }
      ]
    },
    "downloadedImage": {
      "url": "https://cn.bing.com/th?id=OHR.CordobaCathedral_ZH-CN4603063077_UHD.jpg",
      "filename": "20251209_UHD.jpg",
      "date": "20251209",
      "title": "文化交汇之地"
    }
  }
}
```

---

### 3. 处理图片并返回 URL

处理当天的壁纸图片，返回可访问的图片 URL。支持自定义尺寸、格式和缩放模式。

**接口地址：**
```
GET /api/image/process
```

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| width | number | 否 | 1920 | 图片宽度（像素） |
| height | number | 否 | 1080 | 图片高度（像素） |
| format | string | 否 | jpg | 输出格式：jpg, png, webp, avif |
| fit | string | 否 | cover | 缩放模式：cover, contain, fill, inside, outside |

**缩放模式说明：**

| fit 值 | 说明 | 效果 |
|--------|------|------|
| cover | 覆盖 | 保持比例，裁剪以填满目标尺寸（类似 CSS object-fit: cover） |
| contain | 包含 | 保持比例，完整显示图片，可能有留白（类似 CSS object-fit: contain） |
| fill | 填充 | 拉伸填满目标尺寸，可能变形 |
| inside | 内部 | 保持比例，图片完整在目标尺寸内，尺寸可能小于目标 |
| outside | 外部 | 保持比例，图片覆盖目标尺寸，尺寸可能大于目标 |

**使用示例：**

```bash
# 获取 800x600 的 WebP 格式图片
curl "http://localhost:3000/api/image/process?width=800&height=600&format=webp&fit=cover"

# 获取 1920x1080 的 PNG 格式图片，使用 contain 模式
curl "http://localhost:3000/api/image/process?width=1920&height=1080&format=png&fit=contain"

# 获取 1280x720 的 AVIF 格式图片
curl "http://localhost:3000/api/image/process?width=1280&height=720&format=avif"
```

**响应示例：**
```json
{
  "success": true,
  "message": "图片处理成功",
  "data": {
    "url": "http://localhost:3000/processed/wallpaper_800x600_cover_a1b2c3d4.webp",
    "filename": "wallpaper_800x600_cover_a1b2c3d4.webp",
    "size": {
      "width": 800,
      "height": 600
    },
    "format": "webp",
    "fit": "cover",
    "fileSize": "145.23 KB",
    "cached": false
  }
}
```

**前端使用示例：**

```html
<!-- JavaScript 方式 -->
<script>
  fetch('/api/image/process?width=800&height=600&format=webp&fit=cover')
    .then(res => res.json())
    .then(data => {
      document.getElementById('myImg').src = data.data.url;
      console.log('图片大小:', data.data.fileSize);
      console.log('是否使用缓存:', data.data.cached);
    });
</script>
```

---

### 4. 直接返回处理后的图片

直接返回处理后的图片二进制数据，适合在 `<img>` 标签中直接使用。

**接口地址：**
```
GET /api/image/view
```

**查询参数：** 与 `/api/image/process` 相同

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| width | number | 否 | 1920 | 图片宽度（像素） |
| height | number | 否 | 1080 | 图片高度（像素） |
| format | string | 否 | jpg | 输出格式：jpg, png, webp, avif |
| fit | string | 否 | cover | 缩放模式：cover, contain, fill, inside, outside |

**使用示例：**

```bash
# 在浏览器中直接访问
http://localhost:3000/api/image/view?width=1920&height=1080&format=webp&fit=cover

# 使用 curl 下载
curl "http://localhost:3000/api/image/view?width=800&height=600&format=png" -o wallpaper.png
```

**前端使用示例：**

```html
<!-- 方式 1: 直接在 img 标签中使用 -->
<img src="/api/image/view?width=800&height=600&format=webp&fit=cover" 
     alt="Bing 每日壁纸">

<!-- 方式 2: 响应式图片，根据屏幕大小加载不同尺寸 -->
<picture>
  <source media="(max-width: 768px)" 
          srcset="/api/image/view?width=768&height=432&format=webp&fit=cover">
  <source media="(max-width: 1920px)" 
          srcset="/api/image/view?width=1920&height=1080&format=webp&fit=cover">
  <img src="/api/image/view?width=3840&height=2160&format=webp&fit=cover" 
       alt="Bing 壁纸">
</picture>

<!-- 方式 3: 作为背景图片 -->
<div style="
  width: 100vw;
  height: 100vh;
  background-image: url('/api/image/view?width=1920&height=1080&format=webp&fit=cover');
  background-size: cover;
  background-position: center;
"></div>
```

**响应：** 直接返回图片二进制数据，Content-Type 根据格式自动设置。

---

### 5. 清理图片缓存

手动清理所有处理后的图片缓存文件。

**接口地址：**
```
DELETE /api/image/cache
```

**使用示例：**

```bash
curl -X DELETE http://localhost:3000/api/image/cache
```

**响应示例：**
```json
{
  "success": true,
  "message": "缓存清理成功",
  "data": {
    "deletedCount": 15
  }
}
```

---

## 定时任务

项目使用 `node-cron` 实现两个定时任务：

### 1. 壁纸获取任务

- **执行频率**: 每 3 分钟
- **执行内容**: 调用 Bing API 获取最新壁纸并下载到本地
- **Cron 表达式**: `*/3 * * * *`

### 2. 缓存清理任务

- **执行频率**: 每 10 分钟
- **执行内容**: 清理所有处理后的图片缓存
- **Cron 表达式**: `*/10 * * * *`

### 定时任务配置

编辑 `src/jobs/scheduler.js` 文件可以修改定时任务：

```javascript
// 壁纸获取：每 3 分钟
const wallpaperTask = cron.schedule('*/3 * * * *', async () => {
  // ...
});

// 缓存清理：每 10 分钟
const cacheClearTask = cron.schedule('*/10 * * * *', async () => {
  // ...
});
```

**Cron 表达式格式：** `分 时 日 月 周`

示例：
- `*/3 * * * *` - 每 3 分钟
- `0 * * * *` - 每小时整点
- `0 8 * * *` - 每天早上 8:00
- `0 0 * * 0` - 每周日午夜

---

## 工作流程

### 1. 启动时
```
1. 启动 Express 服务器
2. 启动两个定时任务
3. 立即执行一次壁纸获取
4. 下载并保存当天的壁纸
```

### 2. 图片处理流程
```
用户请求 -> 检查缓存 -> 缓存命中？
                            |
                           是 -> 直接返回缓存
                            |
                           否 -> 检查是否有当天壁纸
                                      |
                                    没有 -> 调用 API 获取
                                      |
                                     有 -> 使用 Sharp 处理
                                      |
                                    保存缓存 -> 返回结果
```

### 3. 壁纸管理规则
```
- images/ 目录只保留一张图片（当天的）
- 新的一天到来时，自动删除旧壁纸
- 同一天重复获取会直接覆盖
- processed/ 目录的缓存每 10 分钟清理一次
```

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | JavaScript 运行环境 |
| Express | ^4.18.2 | Web 框架 |
| Sharp | ^0.33.1 | 高性能图片处理库 |
| node-cron | ^3.0.3 | 定时任务调度 |
| axios | ^1.6.2 | HTTP 客户端 |
| dotenv | ^16.3.1 | 环境变量管理 |
| cors | ^2.8.5 | 跨域资源共享 |

---

## 环境配置

### 1. 创建 .env 文件

```bash
# 复制环境变量示例文件
cp .env.example .env
```

### 2. 配置项说明

```env
# 服务器端口
PORT=3000

# 环境模式 (development/production)
NODE_ENV=development

# 定时任务时区
TIMEZONE=Asia/Shanghai
```

---

## 开发指南

### 添加新的 API 接口

1. 在 `src/routes/index.js` 中定义路由
2. 在 `src/controllers/` 中创建控制器
3. 在 `src/services/` 中实现业务逻辑

### 修改图片处理参数

编辑 `src/services/imageProcessService.js`：

```javascript
// 修改默认参数
const {
  width = 1920,    // 默认宽度
  height = 1080,   // 默认高度
  format = 'jpg',  // 默认格式
  fit = 'cover'    // 默认缩放模式
} = options;

// 修改图片质量
sharpInstance = sharpInstance.jpeg({ quality: 90 });
```

---

## 常见问题

### 1. 如何更换壁纸来源？

编辑 `src/services/wallpaperService.js`，修改 API URL：

```javascript
const url = 'https://cn.bing.com/HPImageArchive.aspx';
```

### 2. 如何调整缓存清理频率？

编辑 `src/jobs/scheduler.js`，修改 cron 表达式：

```javascript
// 改为每 30 分钟清理一次
const cacheClearTask = cron.schedule('*/30 * * * *', ...);
```

### 3. 图片处理速度慢怎么办？

- 减小输出图片尺寸
- 使用 WebP 格式（比 PNG 快很多）
- 避免使用 AVIF（处理速度最慢但压缩率最高）

### 4. 如何保留历史壁纸？

修改 `src/services/wallpaperService.js` 中的 `cleanOldImages()` 函数，改为保留多天的图片。

---

## 性能优化建议

### 1. 图片格式选择

| 格式 | 优势 | 劣势 | 适用场景 |
|------|------|------|----------|
| JPG | 兼容性好，体积小 | 不支持透明 | 照片、壁纸 |
| PNG | 支持透明，无损 | 体积大 | 需要透明背景 |
| WebP | 体积小，质量好 | 旧浏览器不支持 | 现代 Web 应用 |
| AVIF | 体积最小 | 处理慢，兼容性差 | 追求极致压缩 |

### 2. 缓存策略

- 相同参数的图片会自动缓存
- 建议设置 CDN 缓存
- 前端可以使用 Service Worker 缓存

### 3. 推荐配置

**移动端：**
```
width=750, height=1334, format=webp, fit=cover
```

**PC 端：**
```
width=1920, height=1080, format=webp, fit=cover
```

**4K 屏幕：**
```
width=3840, height=2160, format=webp, fit=cover
```

---

## 部署说明

### 1. 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/app.js --name bing-wallpaper

# 查看日志
pm2 logs bing-wallpaper

# 重启应用
pm2 restart bing-wallpaper
```

### 2. Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 许可证

ISC

---

## 联系方式

如有问题或建议，欢迎提交 Issue。
