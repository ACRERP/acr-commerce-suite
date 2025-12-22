import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');

const itemsToRemove = [
    'tests',
    'docs',
    'supabase',
    '.git',
    'playwright.config.ts',
    'vitest.config.ts',
    '.env.example',
    'README.md',
];

/**
 * Remove recursivamente um arquivo ou diretório
 */
function removeRecursive(itemPath) {
    if (fs.existsSync(itemPath)) {
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            fs.readdirSync(itemPath).forEach(file => {
                removeRecursive(path.join(itemPath, file));
            });
            fs.rmdirSync(itemPath);
        } else {
            fs.unlinkSync(itemPath);
        }
        console.log(`🗑️ Removido: ${path.relative(rootDir, itemPath)}`);
    }
}

/**
 * Remove todos os arquivos .test.* e .spec.* dentro de um diretório
 */
function removeTestFiles(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            removeTestFiles(filePath);
        } else if (file.includes('.test.') || file.includes('.spec.')) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Removido teste: ${path.relative(rootDir, filePath)}`);
        }
    });
}

console.log('\n' + '='.repeat(40));
console.log('🧹 LIMPANDO PROJETO PARA DISTRIBUIÇÃO');
console.log('='.repeat(40));

// Remover itens da lista
itemsToRemove.forEach(item => {
    removeRecursive(path.join(rootDir, item));
});

// Remover arquivos de teste no src
removeTestFiles(path.join(rootDir, 'src'));

console.log('\n✅ LIMPEZA CONCLUÍDA!');
console.log('='.repeat(40) + '\n');
