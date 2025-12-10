const express = require('express');
const router = express.Router();
const wallpaperController = require('../controllers/wallpaperController');
const imageController = require('../controllers/imageController');

// 获取 Bing 壁纸
// 支持查询参数: format, idx, n, mkt
// 例如: /api/wallpaper?n=5&mkt=en-US
router.get('/wallpaper', wallpaperController.fetchWallpaper);

// 处理图片并返回 URL
// 支持查询参数: width, height, format, fit
// 例如: /api/image/process?width=800&height=600&format=webp&fit=cover
router.get('/image/process', imageController.processImage);

// 直接返回处理后的图片（用于预览）
// 例如: /api/image/view?width=800&height=600&format=webp&fit=contain
router.get('/image/view', imageController.getProcessedImage);

// 清理图片缓存
router.delete('/image/cache', imageController.clearCache);

module.exports = router;

