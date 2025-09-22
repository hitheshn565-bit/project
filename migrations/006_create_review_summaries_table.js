/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('review_summaries', function(table) {
    table.increments('id').primary();
    table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.text('summary_text').notNullable();
    table.jsonb('aspects').defaultTo('{}'); // extracted aspects with sentiment
    table.jsonb('pros_cons').defaultTo('{}'); // structured pros and cons
    table.string('model_version').notNullable();
    table.decimal('confidence_score', 3, 2);
    table.integer('review_count_analyzed').notNullable();
    table.timestamp('generated_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at'); // for cache invalidation
    
    // Indexes
    table.index('product_id');
    table.index('model_version');
    table.index('generated_at');
    table.index('expires_at');
    
    // GIN indexes for JSONB data
    table.index('aspects', 'review_summaries_aspects_gin', 'GIN');
    table.index('pros_cons', 'review_summaries_pros_cons_gin', 'GIN');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('review_summaries');
};
