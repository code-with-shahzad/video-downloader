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
    let inputPath = videoPath;
    let tempVideoPath: string | null = null;

    const cleanupTempVideo = async () => {
        if (tempVideoPath && fs.existsSync(tempVideoPath)) {
            try {
                await fs.promises.unlink(tempVideoPath);
            } catch (e) {
                console.error('Failed to delete temp video:', e);
            }
        }
    };

    try {
        // If videoPath is a URL, download only what we need
        if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
            try {
                const { default: axios } = await import('axios');

                tempVideoPath = path.join(os.tmpdir(), `temp-video-${uniqueId}.mp4`);

                // Calculate how much we need
                const maxTimestamp = Math.max(...timestamps);
                const estimatedBytes = Math.ceil(maxTimestamp + 1) * 500000; // ~500KB per second estimate
                const maxDownload = Math.min(estimatedBytes, 3 * 1024 * 1024); // Cap at 3MB

                console.log(`Downloading ~${(maxDownload / 1024 / 1024).toFixed(1)}MB from ${videoPath}...`);

                const response = await axios({
                    method: 'GET',
                    url: videoPath,
                    responseType: 'stream',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'https://ssstik.io/',
                        'Range': `bytes=0-${maxDownload}`
                    }
                });

                if (response.status !== 200 && response.status !== 206) {
                    throw new Error(`Failed to download video, status: ${response.status}`);
                }

                // Stream to file with size limit
                const writer = fs.createWriteStream(tempVideoPath);
                let downloaded = 0;

                response.data.on('data', (chunk: Buffer) => {
                    downloaded += chunk.length;
                    if (downloaded >= maxDownload) {
                        response.data.destroy(); // Stop early
                    }
                });

                await new Promise<void>((resolve, reject) => {
                    writer.on('finish', () => resolve());
                    writer.on('error', reject);
                    response.data.pipe(writer);
                    response.data.on('error', reject);
                });

                inputPath = tempVideoPath;
                console.log(`Downloaded ${(downloaded / 1024 / 1024).toFixed(2)}MB in ${Date.now() - uniqueId}ms`);
            } catch (dlError: any) {
                console.error('Error downloading video:', dlError.message);
                await cleanupTempVideo();
                return [];
            }
        }

        return new Promise((resolve) => {
            ffmpeg(inputPath)
                .inputOptions([
                    '-vsync', '0',
                    '-an',
                    '-sn'
                ])
                .on('filenames', (files: string[]) => {
                    files.forEach(file => filenames.push(path.join(outputDir, file)));
                })
                .on('end', async () => {
                    console.log('Thumbnails extracted successfully:', filenames);
                    await cleanupTempVideo();
                    resolve(filenames);
                })
                .on('error', async (err) => {
                    console.error('Error extracting thumbnails:', err.message);
                    await cleanupTempVideo();
                    resolve([]);
                })
                .screenshots({
                    count: timestamps.length,
                    timestamps: timestamps.map(t => t.toString()),
                    folder: outputDir,
                    filename: `thumb-${uniqueId}-%s.png`
                });
        });
    } catch (e: any) {
        console.error('Unexpected error in extractThumbnails:', e.message);
        await cleanupTempVideo();
        return [];
    }
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
