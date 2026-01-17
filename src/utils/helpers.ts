import { Platform } from '../types';

/**
 * Detects the platform from a URL
 */
export function detectPlatform(url: string): Platform | null {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        return 'youtube';
    }

    if (urlLower.includes('tiktok.com') || urlLower.includes('vm.tiktok.com')) {
        return 'tiktok';
    }

    if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) {
        return 'instagram';
    }

    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
        return 'twitter';
    }

    return null;
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Formats duration from seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Sanitizes filename for safe file system usage
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}
