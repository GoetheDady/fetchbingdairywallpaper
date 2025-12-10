const wallpaperService = require('../services/wallpaperService');

/**
 * 获取 Bing 壁纸
 */
const fetchWallpaper = async (req, res) => {
  try {
    const { format, idx, n, mkt } = req.query;
    
    // 构建参数对象（只传递存在的参数）
    const params = {};
    if (format) params.format = format;
    if (idx !== undefined) params.idx = parseInt(idx);
    if (n !== undefined) params.n = parseInt(n);
    if (mkt) params.mkt = mkt;
    
    const result = await wallpaperService.fetchBingWallpaper(params);
    
    res.json({
      success: true,
      message: '获取壁纸成功',
      data: result
    });
  } catch (error) {
    console.error('获取壁纸失败:', error);
    res.status(500).json({
      success: false,
      message: '获取壁纸失败',
      error: error.message
    });
  }
};

module.exports = {
  fetchWallpaper
};

