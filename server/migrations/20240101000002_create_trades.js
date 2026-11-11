exports.up = function (knex) {
  return knex.schema.createTable('trades', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().index();
    t.string('trade_date', 10).notNullable().index(); // YYYY-MM-DD
    t.string('stock_name', 100);
    t.string('stock_code', 20);
    t.string('strategy', 50);
    t.integer('score');
    t.float('price');
    t.integer('shares');
    t.float('buy_amount');
    t.float('stop_loss');
    t.float('take_profit');
    t.text('reason');
    t.float('sell_price');
    t.float('return_rate');
    t.float('pnl');
    t.string('status', 20).defaultTo('持仓中');
    t.text('remark');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('trades');
};
