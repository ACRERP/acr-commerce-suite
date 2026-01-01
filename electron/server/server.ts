
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { db } from './db';
import { products } from './schema';
import { eq, like, or } from 'drizzle-orm';

const fastify = Fastify({ logger: true });

fastify.register(cors, { 
    origin: true // Allow all origins (since it's a local tool)
});

// Routes
fastify.get('/', async () => {
    return { status: 'running', service: 'ACR Local Backend' };
});

// Products: List
fastify.get('/api/products', async (request, reply) => {
    const all = await db.select().from(products).where(eq(products.active, true));
    return all;
});

// Products: Get
fastify.get('/api/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
    if (!result.length) return reply.code(404).send({ error: 'Not found' });
    return result[0];
});

// Products: Search
fastify.get('/api/products/search', async (request, reply) => {
    const { q } = request.query as { q: string };
    if (!q) return [];
    
    // Simple search
    const search = `%${q}%`;
    const results = await db.select().from(products).where(
        or(
            like(products.name, search),
            like(products.sku, search),
            like(products.barcode, search)
        )
    ).limit(20);
    
    return results;
});

// Products: Create
fastify.post('/api/products', async (request, reply) => {
    const data = request.body as typeof products.$inferInsert;
    const result = await db.insert(products).values(data).returning();
    return result[0];
});

// Products: Update
fastify.put('/api/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as Partial<typeof products.$inferInsert>;
    const result = await db.update(products).set(data).where(eq(products.id, parseInt(id))).returning();
    return result[0];
});

// Start Server
const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running on http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
