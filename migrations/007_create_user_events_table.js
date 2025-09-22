/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_events', function(table) {
    table.increments('id').primary();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('event_type').notNullable(); // 'view', 'click', 'redirect', 'search'
    table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.uuid('offer_id').references('id').inTable('offers').onDelete('CASCADE');
    table.string('session_id');
    table.jsonb('meta').defaultTo('{}'); // additional event metadata
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    
    // Indexes for analytics and recommendations
    table.index('user_id');
    table.index('event_type');
    table.index('product_id');
    table.index('offer_id');
    table.index('session_id');
    table.index('timestamp');
    table.index(['user_id', 'timestamp']);
    table.index(['user_id', 'event_type']);
    table.index(['product_id', 'event_type']);
    
    // GIN index for meta JSONB
    table.index('meta', 'user_events_meta_gin', 'GIN');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_events');
};
