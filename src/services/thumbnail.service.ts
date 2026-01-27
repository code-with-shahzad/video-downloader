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
        const isUrl = videoPath.startsWith('http://') || videoPath.startsWith('https://');

        const command = ffmpeg();

        if (isUrl) {
            // Set input with protocol options
            command.input(videoPath)
                .inputOptions([
                    '-protocol_whitelist', 'file,http,https,tcp,tls',
                    '-t', '3',
                    '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    '-referer', 'https://ssstik.io/',
                    '-reconnect', '1',
                    '-reconnect_streamed', '1',
                    '-reconnect_delay_max', '2',
                    '-timeout', '10000000',
                    '-vsync', '0',
                    '-an',
                    '-sn'
                ]);
        } else {
            command.input(videoPath)
                .inputOptions([
                    '-vsync', '0',
                    '-an',
                    '-sn'
                ]);
        }

        command
            .on('filenames', (files: string[]) => {
                files.forEach(file => filenames.push(path.join(outputDir, file)));
                console.log('Expected filenames:', filenames);
            })
            .on('start', (commandLine: string) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('end', () => {
                console.log('Thumbnails extracted successfully:', filenames);
                resolve(filenames);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error extracting thumbnails:', err.message);
                console.error('FFmpeg stderr:', stderr);
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