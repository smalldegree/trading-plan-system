exports.up = function (knex) {
  return knex.schema.table('trades', (t) => {
    t.string('sell_date', 10);
  });
};

exports.down = function (knex) {
  return knex.schema.table('trades', (t) => {
    t.dropColumn('sell_date');
  });
};
