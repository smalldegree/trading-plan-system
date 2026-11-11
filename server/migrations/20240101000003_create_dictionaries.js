exports.up = function (knex) {
  return knex.schema.createTable('dictionaries', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().index();
    t.string('type', 30).notNullable();
    t.text('value');
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'type']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('dictionaries');
};
