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

    // Helper to cleanup temp video file
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
        // If videoPath is a URL, download it first
        if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
            try {
                const { default: axios } = await import('axios');
                const { promisify } = await import('util');
                const { pipeline } = await import('stream');
                const streamPipeline = promisify(pipeline);

                tempVideoPath = path.join(os.tmpdir(), `temp-video-${uniqueId}.mp4`);
                console.log(`Downloading video from ${videoPath} to ${tempVideoPath}...`);

                const response = await axios({
                    method: 'GET',
                    url: videoPath,
                    responseType: 'stream',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'https://ssstik.io/'
                    }
                });

                if (response.status !== 200) {
                    throw new Error(`Failed to download video, status: ${response.status}`);
                }

                await streamPipeline(response.data, fs.createWriteStream(tempVideoPath));
                inputPath = tempVideoPath;
                console.log('Video downloaded successfully.');
            } catch (dlError) {
                console.error('Error downloading video for thumbnail extraction:', dlError);
                return []; // Fail gracefully if download fails
            }
        }

        return new Promise((resolve) => {
            ffmpeg(inputPath)
                .inputOptions([
                    '-t 3',
                    // Headers are handled by axios now if we downloaded, but if it was local file these are ignored.
                    // If we failed to download and somehow still here, we might want headers but we returned empty array above.
                    // For local files, headers option doesn't hurt but is irrelevant.
                    // We remove headers here since we are likely acting on a local file now.
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
                    console.error('Error extracting thumbnails:', err);
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
    } catch (e) {
        console.error('Unexpected error in extractThumbnails:', e);
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
