const imageProcessService = require('../services/imageProcessService');

/**
 * 处理图片并返回可访问的 URL
 */
const processImage = async (req, res) => {
  try {
    const { width, height, format, fit } = req.query;
    
    // 转换参数类型
    const options = {};
    if (width) options.width = parseInt(width);
    if (height) options.height = parseInt(height);
    if (format) options.format = format.toLowerCase();
    if (fit) options.fit = fit.toLowerCase();
    
    const result = await imageProcessService.processImage(options);
    
    // 构建可访问的 URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/processed/${result.filename}`;
    
    res.json({
      success: true,
      message: result.cached ? '返回缓存图片' : '图片处理成功',
      data: {
        url: imageUrl,
        filename: result.filename,
        size: result.size,
        format: result.format,
        fit: result.fit,
        fileSize: result.fileSize,
        cached: result.cached
      }
    });
  } catch (error) {
    console.error('处理图片失败:', error);
    res.status(500).json({
      success: false,
      message: '图片处理失败',
      error: error.message
    });
  }
};

/**
 * 直接返回处理后的图片（用于预览）
 */
const getProcessedImage = async (req, res) => {
  try {
    const { width, height, format, fit } = req.query;
    
    // 转换参数类型
    const options = {};
    if (width) options.width = parseInt(width);
    if (height) options.height = parseInt(height);
    if (format) options.format = format.toLowerCase();
    if (fit) options.fit = fit.toLowerCase();
    
    const result = await imageProcessService.processImage(options);
    
    // 设置响应头
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'avif': 'image/avif'
    }[result.format] || 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存 1 小时
    res.sendFile(result.path);
  } catch (error) {
    console.error('获取图片失败:', error);
    res.status(500).json({
      success: false,
      message: '获取图片失败',
      error: error.message
    });
  }
};

/**
 * 清理图片缓存
 */
const clearCache = async (req, res) => {
  try {
    const deletedCount = imageProcessService.clearCache();
    
    res.json({
      success: true,
      message: '缓存清理成功',
      data: {
        deletedCount
      }
    });
  } catch (error) {
    console.error('清理缓存失败:', error);
    res.status(500).json({
      success: false,
      message: '清理缓存失败',
      error: error.message
    });
  }
};

module.exports = {
  processImage,
  getProcessedImage,
  clearCache
};

