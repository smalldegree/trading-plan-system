exports.up = function (knex) {
  return knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('username', 50).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
