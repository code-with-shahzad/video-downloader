import { createWorker } from 'tesseract.js';
import fs from 'fs';

/**
 * Detects if a specific string exists within a set of images.
 * @param imagePaths - Array of absolute paths to images.
 * @param searchString - The text to look for (case-insensitive).
 * @returns Promise resolving to true if text is found in any image.
 */
export async function detectTextInImages(imagePaths: string[], searchString: string): Promise<boolean> {
    const worker = await createWorker('eng');

    try {
        const searchTarget = searchString.toLowerCase().replace(/\s+/g, '');
        const coreTarget = searchTarget.split('.')[0]; // e.g., 'ssstik'

        for (const imagePath of imagePaths) {
            // Check if file exists, wait a bit if not (filesystem sync)
            let exists = fs.existsSync(imagePath);
            if (!exists) {
                console.warn(`File not found immediately: ${imagePath}. Waiting 1s...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                exists = fs.existsSync(imagePath);
            }

            if (!exists) {
                console.error(`File still not found after wait: ${imagePath}`);
                continue;
            }

            const { data: { text } } = await worker.recognize(imagePath);
            // Clean more aggressively: remove everything except letters and numbers
            const cleanedText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            console.log(`OCR Result for ${imagePath} (Cleaned):`, cleanedText);

            if (cleanedText.includes(searchTarget) || (coreTarget && cleanedText.includes(coreTarget))) {
                console.warn(`Found forbidden watermark text "${searchString}" in ${imagePath}`);
                return true;
            }
        }
    } catch (error) {
        console.error('OCR failed:', error);
    } finally {
        await worker.terminate();
    }

    return false;
}
