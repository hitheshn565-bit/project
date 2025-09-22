/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('recommendation_cache', function(table) {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('items').notNullable(); // array of recommended product IDs with scores
    table.string('model_version').notNullable();
    table.string('recommendation_type').notNullable(); // 'cold_start', 'collaborative', 'hybrid'
    table.jsonb('metadata').defaultTo('{}'); // additional recommendation metadata
    table.timestamp('generated_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    
    // Indexes
    table.index('model_version');
    table.index('recommendation_type');
    table.index('generated_at');
    table.index('expires_at');
    
    // GIN indexes for JSONB data
    table.index('items', 'recommendation_cache_items_gin', 'GIN');
    table.index('metadata', 'recommendation_cache_metadata_gin', 'GIN');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('recommendation_cache');
};
