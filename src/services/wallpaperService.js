const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const dayjs = require('dayjs');

// 图片保存目录
const IMAGES_DIR = path.join(__dirname, '../../images');

/**
 * 确保图片目录存在
 */
const ensureImagesDir = () => {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log('📁 创建图片目录:', IMAGES_DIR);
  }
};

/**
 * 清理旧图片，只保留指定日期的图片
 * @param {string} currentDate - 当前日期（格式：YYYYMMDD）
 */
const cleanOldImages = (currentDate) => {
  try {
    ensureImagesDir();
    
    const files = fs.readdirSync(IMAGES_DIR);
    const currentFilename = `${currentDate}_UHD.jpg`;
    
    let deletedCount = 0;
    
    files.forEach(file => {
      // 跳过 .gitkeep 文件和当前日期的图片
      if (file !== '.gitkeep' && file !== currentFilename && file.endsWith('.jpg')) {
        const filepath = path.join(IMAGES_DIR, file);
        fs.unlinkSync(filepath);
        console.log('🗑️  删除旧图片:', file);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      console.log(`✅ 已清理 ${deletedCount} 张旧图片`);
    }
  } catch (error) {
    console.error('❌ 清理旧图片失败:', error.message);
  }
};

/**
 * 下载图片
 * @param {string} imageUrl - 图片 URL
 * @param {string} filename - 文件名
 */
const downloadImage = async (imageUrl, filename) => {
  try {
    ensureImagesDir();
    
    const filepath = path.join(IMAGES_DIR, filename);
    
    console.log('⬇️  开始下载图片...');
    console.log('🔗 图片地址:', imageUrl);
    
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'stream'
    });
    
    await pipeline(response.data, fs.createWriteStream(filepath));
    
    console.log('✅ 图片下载成功！');
    console.log('💾 保存路径:', filepath);
    
    return filepath;
  } catch (error) {
    console.error('❌ 图片下载失败:', error.message);
    throw error;
  }
};

/**
 * 从 Bing API 获取壁纸信息并下载
 * @param {Object} params - API 参数
 * @param {string} params.format - 返回格式，默认 'js'
 * @param {number} params.idx - 开始索引，默认 0
 * @param {number} params.n - 获取数量，默认 1
 * @param {string} params.mkt - 市场地区，默认 'zh-CN'
 */
const fetchBingWallpaper = async (params = {}) => {
  try {
    // 默认参数
    const defaultParams = {
      format: 'js',
      idx: 0,
      n: 1,
      mkt: 'zh-CN'
    };
    
    // 合并参数
    const queryParams = { ...defaultParams, ...params };
    
    // 构建 URL
    const url = 'https://cn.bing.com/HPImageArchive.aspx';
    
    console.log('🔍 正在调用 Bing API...');
    console.log('📝 请求参数:', queryParams);
    
    const response = await axios.get(url, { params: queryParams });
    
    console.log('✅ API 调用成功！');
    console.log('📦 返回结果:', JSON.stringify(response.data, null, 2));
    
    // 获取第一张图片的 urlbase
    if (response.data && response.data.images && response.data.images.length > 0) {
      const firstImage = response.data.images[0];
      const urlbase = firstImage.urlbase;
      
      // 使用本地日期（dayjs）而不是 Bing API 返回的日期，避免时区问题
      const currentDate = dayjs().format('YYYYMMDD');
      
      // 拼接完整的图片 URL
      const imageUrl = `https://cn.bing.com${urlbase}_UHD.jpg`;
      
      // 生成文件名（使用本地日期）
      const filename = `${currentDate}_UHD.jpg`;
      const filepath = path.join(IMAGES_DIR, filename);
      
      console.log('\n📸 准备下载图片...');
      console.log('🏷️  文件名:', filename);
      console.log('📅 本地日期:', currentDate);
      console.log('📅 Bing日期:', firstImage.startdate);
      
      // 检查当前日期的图片是否已存在
      if (fs.existsSync(filepath)) {
        console.log('ℹ️  当天图片已存在，将覆盖');
      } else {
        console.log('🆕 新的一天，清理旧图片...');
        // 如果是新的一天，先清理旧图片
        cleanOldImages(currentDate);
      }
      
      // 下载图片（同一天会覆盖，新的一天会下载新图片）
      const downloadedPath = await downloadImage(imageUrl, filename);
      
      return {
        apiData: response.data,
        downloadedImage: {
          url: imageUrl,
          // filepath: downloadedPath,
          filename,
          date: currentDate,
          title: firstImage.title || firstImage.copyright.split('(')[0].trim()
        }
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ 获取 Bing 壁纸失败:', error.message);
    throw error;
  }
};

module.exports = {
  fetchBingWallpaper,
  downloadImage
};

