/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.string('brand');
    table.jsonb('attributes').defaultTo('{}'); // model_no, UPC, ASIN, tags, etc.
    table.text('canonical_description');
    table.jsonb('images').defaultTo('[]');
    table.string('category');
    table.decimal('avg_rating', 3, 2);
    table.integer('review_count').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for search and filtering
    table.index('title');
    table.index('brand');
    table.index('category');
    table.index('created_at');
    table.index('updated_at');
    
    // GIN index for JSONB attributes
    table.index('attributes', 'products_attributes_gin', 'GIN');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('products');
};
