const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dayjs = require('dayjs');

// 目录配置
const IMAGES_DIR = path.join(__dirname, '../../images');
const PROCESSED_DIR = path.join(__dirname, '../../processed');

/**
 * 确保处理后图片目录存在
 */
const ensureProcessedDir = () => {
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
    console.log('📁 创建处理图片目录:', PROCESSED_DIR);
  }
};

/**
 * 检查是否有当天的壁纸图片
 */
const hasTodayWallpaper = () => {
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(file => file.endsWith('_UHD.jpg'));
    
    if (imageFiles.length === 0) {
      return false;
    }
    
    // 使用 dayjs 获取当天日期
    const today = dayjs().format('YYYYMMDD');
    const todayFile = `${today}_UHD.jpg`;
    
    return files.includes(todayFile);
  } catch (error) {
    return false;
  }
};

/**
 * 获取当前最新的壁纸文件
 */
const getCurrentWallpaper = async () => {
  // 检查是否有当天的壁纸图片
  if (!hasTodayWallpaper()) {
    console.log('⚠️  未找到当天壁纸，开始获取...');
    
    // 动态导入 wallpaperService 避免循环依赖
    const wallpaperService = require('./wallpaperService');
    
    try {
      await wallpaperService.fetchBingWallpaper();
      console.log('✅ 当天壁纸获取成功');
    } catch (error) {
      console.error('❌ 获取当天壁纸失败:', error.message);
      throw new Error('无法获取当天壁纸');
    }
  }
  
  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter(file => file.endsWith('_UHD.jpg'));
  
  if (imageFiles.length === 0) {
    throw new Error('未找到壁纸图片');
  }
  
  // 返回第一个（因为目录中只保留一张）
  return path.join(IMAGES_DIR, imageFiles[0]);
};

/**
 * 生成缓存文件名
 */
const generateCacheFilename = (params) => {
  const { width, height, format, fit } = params;
  const hash = crypto
    .createHash('md5')
    .update(`${width}_${height}_${format}_${fit}`)
    .digest('hex')
    .substring(0, 8);
  
  return `wallpaper_${width}x${height}_${fit}_${hash}.${format}`;
};

/**
 * 处理图片
 * @param {Object} options - 处理选项
 * @param {number} options.width - 宽度
 * @param {number} options.height - 高度
 * @param {string} options.format - 输出格式 (jpg, png, webp, avif)
 * @param {string} options.fit - 缩放模式 (cover, contain, fill, inside, outside)
 */
const processImage = async (options = {}) => {
  try {
    ensureProcessedDir();
    
    // 默认参数
    const {
      width = 1920,
      height = 1080,
      format = 'jpg',
      fit = 'cover'
    } = options;
    
    // 验证参数
    const validFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    const validFits = ['cover', 'contain', 'fill', 'inside', 'outside'];
    
    if (!validFormats.includes(format.toLowerCase())) {
      throw new Error(`不支持的格式: ${format}。支持的格式: ${validFormats.join(', ')}`);
    }
    
    if (!validFits.includes(fit.toLowerCase())) {
      throw new Error(`不支持的 fit 模式: ${fit}。支持的模式: ${validFits.join(', ')}`);
    }
    
    console.log('🖼️  开始处理图片...');
    console.log('📝 处理参数:', { width, height, format, fit });
    
    // 生成输出文件名
    const outputFilename = generateCacheFilename({ width, height, format, fit });
    const outputPath = path.join(PROCESSED_DIR, outputFilename);
    
    // 检查缓存 - 如果缓存存在，直接返回
    if (fs.existsSync(outputPath)) {
      console.log('✅ 缓存命中，直接返回:', outputFilename);
      
      // 获取文件大小
      const stats = fs.statSync(outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      
      return {
        filename: outputFilename,
        path: outputPath,
        size: { width, height },
        format,
        fit,
        fileSize: fileSizeKB + ' KB',
        cached: true
      };
    }
    
    // 缓存未命中，需要处理图片
    console.log('❌ 缓存未命中，开始处理图片...');
    
    // 获取原始图片路径（如果没有当天的图片会自动获取）
    const sourcePath = await getCurrentWallpaper();
    console.log('📂 源图片:', path.basename(sourcePath));
    
    // 使用 sharp 处理图片
    let sharpInstance = sharp(sourcePath);
    
    // 调整大小
    sharpInstance = sharpInstance.resize(width, height, {
      fit: fit,
      position: 'center',
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    });
    
    // 转换格式
    const formatLower = format.toLowerCase();
    switch (formatLower) {
      case 'jpg':
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: 90 });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality: 90 });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: 90 });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ quality: 90 });
        break;
    }
    
    // 保存处理后的图片
    await sharpInstance.toFile(outputPath);
    
    // 获取文件大小
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    
    console.log('✅ 图片处理完成！');
    console.log('💾 输出文件:', outputFilename);
    console.log('📦 文件大小:', fileSizeKB, 'KB');
    
    return {
      filename: outputFilename,
      path: outputPath,
      size: { width, height },
      format,
      fit,
      fileSize: fileSizeKB + ' KB',
      cached: false
    };
  } catch (error) {
    console.error('❌ 图片处理失败:', error.message);
    throw error;
  }
};

/**
 * 清理处理后的图片缓存
 */
const clearCache = () => {
  try {
    ensureProcessedDir();
    const files = fs.readdirSync(PROCESSED_DIR);
    
    let deletedCount = 0;
    files.forEach(file => {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(PROCESSED_DIR, file));
        deletedCount++;
      }
    });
    
    console.log(`✅ 已清理 ${deletedCount} 个缓存文件`);
    return deletedCount;
  } catch (error) {
    console.error('❌ 清理缓存失败:', error.message);
    throw error;
  }
};

module.exports = {
  processImage,
  clearCache
};

