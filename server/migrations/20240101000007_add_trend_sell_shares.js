exports.up = function (knex) {
  return knex.schema.table('trades', (t) => {
    t.string('trend', 20);
    t.integer('sell_shares');
  });
};

exports.down = function (knex) {
  return knex.schema.table('trades', (t) => {
    t.dropColumn('trend');
    t.dropColumn('sell_shares');
  });
};
