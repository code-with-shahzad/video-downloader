import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Set ffmpeg path to the static binary
if (ffmpegInstaller) {
    ffmpeg.setFfmpegPath(ffmpegInstaller);
}

export interface ThumbnailOptions {
    videoPath: string;
    timestamps: number[];
    outputDir?: string;
}

const DEFAULT_TEMP_DIR = os.tmpdir();

/**
 * Extracts thumbnails from a video at specific timestamps.
 * @param options - Configuration for extraction
 * @returns Promise that resolves with the paths of generated thumbnails
 */
export async function extractThumbnails(options: ThumbnailOptions): Promise<string[]> {
    const { videoPath, timestamps, outputDir = DEFAULT_TEMP_DIR } = options;
    const filenames: string[] = [];
    const uniqueId = Date.now();

    return new Promise((resolve) => {
        ffmpeg(videoPath)
            .inputOptions([
                '-t 3',
                '-headers', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36\r\nReferer: https://tikcdn.io/ssstik/\r\n',
                '-reconnect', '1',
                '-reconnect_streamed', '1',
                '-reconnect_delay_max', '2',
                '-vsync', '0',
                '-an',
                '-sn'
            ])
            .on('filenames', (files: string[]) => {
                files.forEach(file => filenames.push(path.join(outputDir, file)));
            })
            .on('end', () => {
                console.log('Thumbnails extracted successfully:', filenames);
                resolve(filenames);
            })
            .on('error', (err) => {
                console.error('Error extracting thumbnails:', err);
                resolve([]);
            })
            .screenshots({
                count: timestamps.length,
                timestamps: timestamps.map(t => t.toString()),
                folder: outputDir,
                filename: `thumb-${uniqueId}-%s.png`
            });
    });
}

/**
 * Deletes files at the specified paths.
 * @param filePaths - Array of absolute file paths to delete
 */
export async function cleanupThumbnails(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                console.log(`Deleted: ${filePath}`);
            }
        } catch (err) {
            console.error(`Failed to delete ${filePath}:`, err);
        }
    }
}

/**
 * Convenience function to extract and then cleanup (after a delay or a callback)
 * @param videoPath - Path to the video file
 */
export async function handleTemporaryThumbnails(videoPath: string): Promise<void> {
    const timestamps = [1, 3, 5];
    try {
        const thumbnails = await extractThumbnails({ videoPath, timestamps });

        // Simulate some work being done with the images
        await new Promise(resolve => setTimeout(resolve, 5000));

        await cleanupThumbnails(thumbnails);
        console.log('Temporary thumbnails cleaned up.');
    } catch (error) {
        console.error('Error in handleTemporaryThumbnails:', error);
    }
}