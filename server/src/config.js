require('dotenv').config();
const path = require('path');

const DB_CLIENT = process.env.DB_CLIENT || 'better-sqlite3';

// 根据 DB_CLIENT 构建 knex 连接配置，方便在不同数据库之间切换
let connection;
if (DB_CLIENT === 'sqlite3' || DB_CLIENT === 'better-sqlite3') {
  connection = {
    filename:
      process.env.DB_FILENAME ||
      path.join(__dirname, '..', 'data', 'trading.sqlite'),
  };
} else if (DB_CLIENT === 'mysql' || DB_CLIENT === 'mysql2') {
  connection = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trading_plan',
  };
} else if (DB_CLIENT === 'pg') {
  connection = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trading_plan',
  };
} else {
  throw new Error(`不支持的 DB_CLIENT: ${DB_CLIENT}`);
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    client: DB_CLIENT,
    connection,
    useNullAsDefault: DB_CLIENT === 'sqlite3' || DB_CLIENT === 'better-sqlite3',
  },
};
