
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    price: real('price').notNull(),
    cost_price: real('cost_price'),
    stock_quantity: integer('stock_quantity').default(0),
    sku: text('sku'),
    barcode: text('barcode'),
    category: text('category'),
    unit: text('unit').default('UN'),
    min_stock: integer('min_stock').default(0),
    active: integer('active', { mode: 'boolean' }).default(true),
    image_url: text('image_url'),
    business_profile_id: text('business_profile_id'), // For multi-tenancy sync
    // Sync Metadata
    synced_at: text('synced_at'),
    supabase_id: integer('supabase_id') // To map back to cloud
});
