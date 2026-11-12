const path = require('path');
require('dotenv').config();

const migrations = {
  directory: path.join(__dirname, 'migrations'),
};

// SQLite 配置（默认）
const sqlite = {
  client: 'better-sqlite3',
  connection: {
    filename:
      process.env.DB_FILENAME || path.join(__dirname, 'data', 'trading.sqlite'),
  },
  useNullAsDefault: true,
  migrations,
};

// MySQL 配置（设置 DB_CLIENT=mysql 或 DB_CLIENT=mysql2 时使用）
const mysql = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trading_plan',
  },
  migrations,
};

const DB_CLIENT = process.env.DB_CLIENT || 'better-sqlite3';
const active = DB_CLIENT === 'mysql' || DB_CLIENT === 'mysql2' ? mysql : sqlite;

module.exports = {
  development: active,
  production: active,
  test: active,
  sqlite,
  mysql,
};
