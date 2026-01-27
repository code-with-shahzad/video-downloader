import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

let workerPromise: Promise<any> | null = null;

async function getWorker() {
    if (workerPromise) return workerPromise;

    workerPromise = (async () => {
        console.log('[OCR] Initializing persistent worker...');
        const cachePath = path.join(os.tmpdir(), 'ocr-cache-v2');
        if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

        const w = await createWorker('eng', 1, {
            logger: m => null,
            cachePath: cachePath,
            corePath: path.resolve('./node_modules/tesseract.js-core/tesseract-core.wasm.js'),
            langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
            gzip: true
        });

        await w.setParameters({
            tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyz0123456789. ',
        });
        return w;
    })();

    return workerPromise;
}

// Pre-initialize
getScheduler().catch(() => { });
async function getScheduler() { await getWorker(); }

/**
 * Detects if a specific string exists within a set of images.
 * @param imagePaths - Array of absolute paths to images.
 * @param searchString - The text to look for (case-insensitive).
 * @returns Promise resolving to true if text is found in any image.
 */
export async function detectTextInImages(imagePaths: string[], searchString: string): Promise<boolean> {
    const ocrWorker = await getWorker();

    try {
        const searchTarget = searchString.toLowerCase().replace(/\s+/g, '');
        const coreTarget = searchTarget.split('.')[0];

        for (const imagePath of imagePaths) {
            let exists = fs.existsSync(imagePath);
            let attempts = 0;
            while (!exists && attempts < 5) {
                await new Promise(resolve => setTimeout(resolve, 200));
                exists = fs.existsSync(imagePath);
                attempts++;
            }

            if (!exists) {
                console.error(`File still not found: ${imagePath}`);
                continue;
            }

            const { data: { text } } = await ocrWorker.recognize(imagePath);
            const cleanedText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            console.log(`OCR Result for ${imagePath} (Cleaned):`, cleanedText);

            if (cleanedText.includes(searchTarget) || (coreTarget && cleanedText.includes(coreTarget))) {
                console.warn(`Found forbidden watermark text "${searchString}" in ${imagePath}`);
                return true;
            }
        }
    } catch (error) {
        console.error('OCR failed:', error);
    }

    return false;
}
