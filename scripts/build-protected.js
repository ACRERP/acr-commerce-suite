import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist/assets');

/**
 * Ofusca recursivamente arquivos JavaScript em um diretório
 */
function obfuscateDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`❌ Diretório não encontrado: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            obfuscateDirectory(filePath);
        } else if (file.endsWith('.js')) {
            console.log(`🛡️ Ofuscando: ${file}...`);
            const code = fs.readFileSync(filePath, 'utf8');

            const obfuscated = JavaScriptObfuscator.obfuscate(code, {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.4,
                debugProtection: true,
                debugProtectionInterval: 2000,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                renameGlobals: false,
                rotateStringArray: true,
                selfDefending: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.75,
                transformObjectKeys: true,
                unicodeEscapeSequence: false
            });

            fs.writeFileSync(filePath, obfuscated.getObfuscatedCode());
        }
    });
}

// Executar após build
console.log('\n' + '='.repeat(40));
console.log('🚀 INICIANDO PROTEÇÃO DE CÓDIGO');
console.log('='.repeat(40));

try {
    obfuscateDirectory(distDir);
    console.log('\n✅ PROTEÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(40) + '\n');
} catch (error) {
    console.error('\n❌ ERRO DURANTE A OFUSCAÇÃO:', error);
    process.exit(1);
}
