const config = require('./src/config');

// 供 `knex migrate:*` CLI 使用，配置与运行时保持一致
module.exports = {
  development: config.db,
  production: config.db,
  test: config.db,
};
