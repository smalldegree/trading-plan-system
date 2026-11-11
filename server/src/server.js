const fs = require('fs');
const path = require('path');
const app = require('./app');
const db = require('./db');
const config = require('./config');

// 确保 sqlite 数据目录存在
if (
  config.db.client === 'sqlite3' ||
  config.db.client === 'better-sqlite3'
) {
  const dir = path.dirname(config.db.connection.filename);
  if (dir && dir !== '.' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function start() {
  try {
    // 启动时自动执行迁移
    await db.migrate.latest();
    console.log('数据库迁移完成');
  } catch (e) {
    console.error('数据库迁移失败:', e.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`交易计划记录系统后端已启动: http://localhost:${config.port}`);
  });
}

start();
