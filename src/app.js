const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes');
const scheduler = require('./jobs/scheduler');

// 加载环境变量
dotenv.config();

// 解析命令行参数获取端口号
const getPortFromArgs = () => {
  const args = process.argv.slice(2);
  
  // 支持格式：--port 4000 或 -p 4000
  const portIndex = args.findIndex(arg => arg === '--port' || arg === '-p');
  if (portIndex !== -1 && args[portIndex + 1]) {
    const port = parseInt(args[portIndex + 1]);
    if (!isNaN(port)) return port;
  }
  
  // 支持格式：直接传递数字 4000
  const numericArg = args.find(arg => /^\d+$/.test(arg));
  if (numericArg) {
    const port = parseInt(numericArg);
    if (!isNaN(port)) return port;
  }
  
  return null;
};

// 创建 Express 应用
const app = express();
// 端口优先级：命令行参数 > 环境变量 > 默认值
const PORT = getPortFromArgs() || process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 处理后的图片
app.use('/processed', express.static('processed'));

// 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '接口不存在' 
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📅 定时任务已启动`);
  
  // 启动定时任务
  scheduler.start();
});

module.exports = app;

