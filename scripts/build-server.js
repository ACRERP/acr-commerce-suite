import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const production = process.argv.includes('--production');

async function buildServer() {
    console.log('🏗️  Building Backend Server...');

    try {
        await esbuild.build({
            entryPoints: ['electron/server/server.ts'],
            bundle: true,
            platform: 'node',
            target: 'node18',
            outfile: 'dist-electron/server.cjs',
            external: ['electron', 'better-sqlite3', 'fastify', '@fastify/cors', 'drizzle-orm'], // Native modules and complex packages must be external
            minify: production,
            sourcemap: !production,
        });

        console.log('✅ Backend Server built successfully!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

buildServer();
