exports.up = function (knex) {
  return knex.schema.table('trades', (t) => {
    t.string('point', 10);
    t.float('sell_amount');
  });
};

exports.down = function (knex) {
  return knex.schema.table('trades', (t) => {
    t.dropColumn('point');
    t.dropColumn('sell_amount');
  });
};
