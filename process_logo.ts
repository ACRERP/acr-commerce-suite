
import sharp from 'sharp';
import * as path from 'path';

const INPUT_PATH = 'C:/Users/Alisson Cruz/.gemini/antigravity/brain/7243aa6b-8535-4d22-a9f6-4abadb704ce9/uploaded_image_1765472750569.png';
const PUBLIC_DIR = path.resolve('public');

async function processLogo() {
    console.log(`Loading logo from: ${INPUT_PATH}`);

    try {
        // Resize and Save 192x192
        await sharp(INPUT_PATH)
            .resize(192, 192)
            .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));
        console.log('Created pwa-192x192.png');

        // Resize and Save 512x512
        await sharp(INPUT_PATH)
            .resize(512, 512)
            .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));
        console.log('Created pwa-512x512.png');

        // Optional: Save as generic logo.png (e.g. 512px)
        await sharp(INPUT_PATH)
            .resize(512, 512)
            .toFile(path.join(PUBLIC_DIR, 'logo.png'));
        console.log('Created logo.png');

    } catch (error) {
        console.error('Error processing logo:', error);
    }
}

processLogo();
