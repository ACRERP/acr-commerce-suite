
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Determine database path
// In production, use userData directory. In dev, project root.
const isDev = process.env.NODE_ENV === 'development';
const dbPath = isDev 
    ? path.join(__dirname, '../../local.db') 
    : path.join(process.resourcesPath, 'local.db');

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

console.log(`Database path: ${dbPath}`);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Auto-migrate helper (simple for now)
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
// NOTE: migrate usually needs the migrations folder. For this prototype we might just push schema.
// For now, let's use a simple initialization script if tables don't exist.
const initDb = () => {
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        cost_price REAL,
        stock_quantity INTEGER DEFAULT 0,
        sku TEXT,
        barcode TEXT,
        category TEXT,
        unit TEXT DEFAULT 'UN',
        min_stock INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        image_url TEXT,
        business_profile_id TEXT,
        synced_at TEXT,
        supabase_id INTEGER
    );
    `);
    console.log("Database initialized.");
};

initDb();
