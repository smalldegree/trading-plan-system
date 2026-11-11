exports.up = function (knex) {
  return knex.schema.table('trades', (t) => {
    t.string('strong_reversal', 4).defaultTo('否');
    t.string('position_preferred', 4).defaultTo('否');
    t.string('pullback_sufficient', 4).defaultTo('否');
    t.text('summary');
  });
};

exports.down = function (knex) {
  return knex.schema.table('trades', (t) => {
    t.dropColumn('strong_reversal');
    t.dropColumn('position_preferred');
    t.dropColumn('pullback_sufficient');
    t.dropColumn('summary');
  });
};
