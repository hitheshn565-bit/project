/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('price_snapshots', function(table) {
    table.increments('id').primary();
    table.uuid('offer_id').references('id').inTable('offers').onDelete('CASCADE');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.decimal('price', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    
    // Indexes for time-series queries
    table.index('offer_id');
    table.index('timestamp');
    table.index(['offer_id', 'timestamp']);
    
    // Composite index for efficient price history queries
    table.index(['offer_id', 'timestamp', 'price']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('price_snapshots');
};
