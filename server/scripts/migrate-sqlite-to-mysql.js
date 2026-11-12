// 数据库迁移脚本：将 SQLite 数据迁移到 MySQL（切换数据库时使用，保证数据不丢失）
//
// 使用前提：
//   1. 已创建 MySQL 数据库，并在 server/.env 中配置 DB_CLIENT=mysql2 等连接信息
//   2. 已在 MySQL 上执行建表迁移：npm run migrate
//
// 用法：cd server && node scripts/migrate-sqlite-to-mysql.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const knex = require('knex');

// 源：SQLite
const sqlite = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.join(__dirname, '..', 'data', 'trading.sqlite'),
  },
  useNullAsDefault: true,
});

// 目标：MySQL
const mysql = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trading_plan',
  },
});

const TABLES = ['users', 'trades'];

async function copyTable(table) {
  const rows = await sqlite(table).select('*');
  if (rows.length === 0) {
    console.log(`  ${table}: 0 条（跳过）`);
    return;
  }
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await mysql(table).insert(rows.slice(i, i + CHUNK));
  }
  console.log(`  ${table}: 迁移 ${rows.length} 条`);
}

(async () => {
  console.log('==> 开始从 SQLite 迁移数据到 MySQL');
  try {
    for (const t of TABLES) {
      await copyTable(t);
    }
    console.log('==> 迁移完成');
  } catch (e) {
    console.error('迁移失败：', e.message);
    process.exit(1);
  } finally {
    await sqlite.destroy();
    await mysql.destroy();
  }
})();
