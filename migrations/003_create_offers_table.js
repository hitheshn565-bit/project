/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('offers', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.string('seller_name').notNullable();
    table.string('seller_site').notNullable(); // 'ebay', 'etsy', 'amazon', etc.
    table.string('seller_site_id').notNullable(); // native listing ID
    table.decimal('current_price', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.string('url').notNullable();
    table.string('availability').defaultTo('available'); // 'available', 'out_of_stock', 'limited'
    table.jsonb('shipping_info').defaultTo('{}');
    table.decimal('rating', 3, 2);
    table.integer('review_count').defaultTo(0);
    table.timestamp('last_checked_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('product_id');
    table.index('seller_site');
    table.index('current_price');
    table.index('availability');
    table.index('last_checked_at');
    
    // Unique constraint for seller_site + seller_site_id
    table.unique(['seller_site', 'seller_site_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('offers');
};
