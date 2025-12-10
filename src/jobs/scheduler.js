const cron = require('node-cron');
const dayjs = require('dayjs');
const wallpaperService = require('../services/wallpaperService');
const imageProcessService = require('../services/imageProcessService');

/**
 * 定时任务：每 12 小时执行一次 - 获取壁纸
 */
const wallpaperTask = cron.schedule(
  '0 */12 * * *', // Cron 表达式: 每 12 小时（每天 0:00 和 12:00）
  async () => {
    console.log('\n==========================================');
    console.log('⏰ 壁纸获取任务触发 - ' + dayjs().format('YYYY-MM-DD HH:mm:ss'));
    console.log('==========================================');
    
    try {
      // 调用 API，可以传入自定义参数
      await wallpaperService.fetchBingWallpaper({
        // format: 'js',
        // idx: 0,
        // n: 1,
        // mkt: 'zh-CN'
      });
    } catch (error) {
      console.error('❌ 壁纸获取任务执行失败:', error.message);
    }
    
    console.log('==========================================\n');
  },
  {
    scheduled: false, // 不立即启动，等待手动调用 start()
    timezone: 'Asia/Shanghai' // 设置时区
  }
);

/**
 * 定时任务：每 6 小时清理一次缓存
 */
const cacheClearTask = cron.schedule(
  '0 */6 * * *', // Cron 表达式: 每 6 小时（每天 0:00、6:00、12:00、18:00）
  async () => {
    console.log('\n==========================================');
    console.log('🧹 缓存清理任务触发 - ' + dayjs().format('YYYY-MM-DD HH:mm:ss'));
    console.log('==========================================');
    
    try {
      const deletedCount = imageProcessService.clearCache();
      console.log(`✅ 缓存清理完成，删除 ${deletedCount} 个文件`);
    } catch (error) {
      console.error('❌ 缓存清理任务执行失败:', error.message);
    }
    
    console.log('==========================================\n');
  },
  {
    scheduled: false,
    timezone: 'Asia/Shanghai'
  }
);

/**
 * 启动所有定时任务
 */
const start = () => {
  console.log('📅 正在启动定时任务...');
  console.log('🌏 时区: Asia/Shanghai\n');
  
  // 启动壁纸获取任务
  wallpaperTask.start();
  console.log('✅ 壁纸获取任务已启动（每 12 小时：0:00 和 12:00）');
  
  // 启动缓存清理任务
  cacheClearTask.start();
  console.log('✅ 缓存清理任务已启动（每 6 小时：0:00、6:00、12:00、18:00）');
  
  console.log('');
  
  // 启动时立即执行一次获取壁纸
  console.log('🚀 立即执行一次壁纸获取任务...\n');
  wallpaperService.fetchBingWallpaper()
    .catch(error => {
      console.error('❌ 初始执行失败:', error.message);
    });
};

/**
 * 停止所有定时任务
 */
const stop = () => {
  wallpaperTask.stop();
  cacheClearTask.stop();
  console.log('⏹️  所有定时任务已停止');
};

module.exports = {
  start,
  stop,
  wallpaperTask,
  cacheClearTask
};

