/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('reviews', function(table) {
    table.increments('id').primary();
    table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.string('source').notNullable(); // 'ebay', 'etsy', 'amazon', etc.
    table.string('source_review_id'); // original review ID from source
    table.text('raw_text').notNullable();
    table.decimal('rating', 3, 2);
    table.string('language', 5).defaultTo('en');
    table.string('reviewer_name');
    table.timestamp('review_date');
    table.jsonb('parsed').defaultTo('{}'); // sentiment, aspects, summary_id
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('product_id');
    table.index('source');
    table.index('rating');
    table.index('review_date');
    table.index('created_at');
    
    // Unique constraint for source + source_review_id
    table.unique(['source', 'source_review_id']);
    
    // GIN index for parsed JSONB data
    table.index('parsed', 'reviews_parsed_gin', 'GIN');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('reviews');
};
