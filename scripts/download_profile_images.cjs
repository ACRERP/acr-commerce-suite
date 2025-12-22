
const fs = require('fs');
const path = require('path');
const https = require('https');

const assetsDir = path.join(__dirname, 'src', 'assets', 'profiles');

if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

const profiles = [
    { id: 'bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200' },
    { id: 'restaurant', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200' },
    { id: 'market', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200' },
    { id: 'clothing_store', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200' },
    { id: 'mechanic', url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200' }
];

async function download(id, url) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(assetsDir, `${id}.jpg`);
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${id}.jpg`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => { });
            reject(err);
        });
    });
}

async function main() {
    for (const p of profiles) {
        try {
            await download(p.id, p.url);
        } catch (e) {
            console.error(`Failed to download ${p.id}:`, e.message);
        }
    }
}

main();
