var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/server/server.ts
var import_fastify = __toESM(require("fastify"), 1);
var import_cors = __toESM(require("@fastify/cors"), 1);

// electron/server/db.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_better_sqlite32 = require("drizzle-orm/better-sqlite3");

// electron/server/schema.ts
var schema_exports = {};
__export(schema_exports, {
  products: () => products
});
var import_sqlite_core = require("drizzle-orm/sqlite-core");
var products = (0, import_sqlite_core.sqliteTable)("products", {
  id: (0, import_sqlite_core.integer)("id").primaryKey({ autoIncrement: true }),
  name: (0, import_sqlite_core.text)("name").notNull(),
  description: (0, import_sqlite_core.text)("description"),
  price: (0, import_sqlite_core.real)("price").notNull(),
  cost_price: (0, import_sqlite_core.real)("cost_price"),
  stock_quantity: (0, import_sqlite_core.integer)("stock_quantity").default(0),
  sku: (0, import_sqlite_core.text)("sku"),
  barcode: (0, import_sqlite_core.text)("barcode"),
  category: (0, import_sqlite_core.text)("category"),
  unit: (0, import_sqlite_core.text)("unit").default("UN"),
  min_stock: (0, import_sqlite_core.integer)("min_stock").default(0),
  active: (0, import_sqlite_core.integer)("active", { mode: "boolean" }).default(true),
  image_url: (0, import_sqlite_core.text)("image_url"),
  business_profile_id: (0, import_sqlite_core.text)("business_profile_id"),
  // For multi-tenancy sync
  // Sync Metadata
  synced_at: (0, import_sqlite_core.text)("synced_at"),
  supabase_id: (0, import_sqlite_core.integer)("supabase_id")
  // To map back to cloud
});

// electron/server/db.ts
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var isDev = process.env.NODE_ENV === "development";
var dbPath = isDev ? import_path.default.join(__dirname, "../../local.db") : import_path.default.join(process.resourcesPath, "local.db");
var dir = import_path.default.dirname(dbPath);
if (!import_fs.default.existsSync(dir)) {
  import_fs.default.mkdirSync(dir, { recursive: true });
}
console.log(`Database path: ${dbPath}`);
var sqlite = new import_better_sqlite3.default(dbPath);
var db = (0, import_better_sqlite32.drizzle)(sqlite, { schema: schema_exports });
var initDb = () => {
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

// electron/server/server.ts
var import_drizzle_orm = require("drizzle-orm");
var fastify = (0, import_fastify.default)({ logger: true });
fastify.register(import_cors.default, {
  origin: true
  // Allow all origins (since it's a local tool)
});
fastify.get("/", async () => {
  return { status: "running", service: "ACR Local Backend" };
});
fastify.get("/api/products", async (request, reply) => {
  const all = await db.select().from(products).where((0, import_drizzle_orm.eq)(products.active, true));
  return all;
});
fastify.get("/api/products/:id", async (request, reply) => {
  const { id } = request.params;
  const result = await db.select().from(products).where((0, import_drizzle_orm.eq)(products.id, parseInt(id))).limit(1);
  if (!result.length) return reply.code(404).send({ error: "Not found" });
  return result[0];
});
fastify.get("/api/products/search", async (request, reply) => {
  const { q } = request.query;
  if (!q) return [];
  const search = `%${q}%`;
  const results = await db.select().from(products).where(
    (0, import_drizzle_orm.or)(
      (0, import_drizzle_orm.like)(products.name, search),
      (0, import_drizzle_orm.like)(products.sku, search),
      (0, import_drizzle_orm.like)(products.barcode, search)
    )
  ).limit(20);
  return results;
});
fastify.post("/api/products", async (request, reply) => {
  const data = request.body;
  const result = await db.insert(products).values(data).returning();
  return result[0];
});
fastify.put("/api/products/:id", async (request, reply) => {
  const { id } = request.params;
  const data = request.body;
  const result = await db.update(products).set(data).where((0, import_drizzle_orm.eq)(products.id, parseInt(id))).returning();
  return result[0];
});
var start = async () => {
  try {
    await fastify.listen({ port: 3e3, host: "0.0.0.0" });
    console.log("Server running on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
//# sourceMappingURL=server.cjs.map
