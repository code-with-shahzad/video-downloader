import { VideoInfo, DownloadResult, Platform } from '../types';
import { detectPlatform, formatDuration, sanitizeFilename } from '../utils/helpers';

// Top-level imports - correct usage from docs
import { YtDlp } from 'ytdlp-nodejs';
import ytdl from '@distube/ytdl-core';
import TikTokAPI from '@tobyg74/tiktok-api-dl';
import { TwitterDL } from 'twitter-downloader';

// Initialize ytdlp instance
const ytdlp = new YtDlp();

// ==================== GLOBAL DOWNLOAD FUNCTION ====================

/**
 * Universal download function
 * @param url - Video URL
 * @param fallback - Optional platform fallback (e.g., 'tiktok', 'youtube')
 * 
 * Strategy:
 * 1. Try yt-dlp first (works for ALL platforms)
 * 2. If fails and fallback is specified, use platform-specific package
 */
export async function downloadVideo(
    url: string,
    fallback?: Platform
): Promise<DownloadResult> {
    const platform = fallback || detectPlatform(url) || 'unknown';

    // Try yt-dlp first
    try {
        console.log(`[Downloader] Trying yt-dlp...`);
        const result = await downloadWithYtDlp(url, platform);
        console.log(`[Downloader] ✓ Success with yt-dlp`);
        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[Downloader] ✗ yt-dlp failed: ${message}`);
    }

    // Fallback to platform-specific
    if (fallback) {
        try {
            console.log(`[Downloader] Trying ${fallback} fallback...`);
            const result = await downloadWithFallback(url, fallback);
            console.log(`[Downloader] ✓ Success with ${fallback} package`);
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.log(`[Downloader] ✗ ${fallback} fallback failed: ${message}`);
            throw new Error(`All methods failed for ${fallback}`);
        }
    }

    throw new Error('yt-dlp failed and no fallback specified');
}

/**
 * Get video info
 * @param url - Video URL
 * @param fallback - Optional platform fallback
 */
export async function getVideoInfo(
    url: string,
    fallback?: Platform
): Promise<VideoInfo> {
    const platform = fallback || detectPlatform(url) || 'unknown';

    // Try yt-dlp first
    try {
        console.log(`[Info] Trying yt-dlp...`);
        const result = await getInfoWithYtDlp(url, platform);
        console.log(`[Info] ✓ Success with yt-dlp`);
        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[Info] ✗ yt-dlp failed: ${message}`);
    }

    // Fallback to platform-specific
    if (fallback) {
        try {
            console.log(`[Info] Trying ${fallback} fallback...`);
            const result = await getInfoWithFallback(url, fallback);
            console.log(`[Info] ✓ Success with ${fallback} package`);
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.log(`[Info] ✗ ${fallback} fallback failed: ${message}`);
            throw new Error(`All methods failed for ${fallback}`);
        }
    }

    throw new Error('yt-dlp failed and no fallback specified');
}

// ==================== YT-DLP (Universal) ====================

async function downloadWithYtDlp(url: string, platform: string): Promise<DownloadResult> {
    const info = await ytdlp.getInfoAsync(url);

    // Handle video type
    if (info._type === 'video') {
        const formats = info.formats || [];

        // Find best format with video+audio
        let selectedFormat = formats.find(
            (f) => f.vcodec !== 'none' && f.acodec !== 'none'
        );

        if (!selectedFormat && formats.length) {
            selectedFormat = formats[0];
        }

        const title = String(info.title || 'video');
        const ext = String(selectedFormat?.ext || 'mp4');

        return {
            downloadUrl: String(selectedFormat?.url || info.url || ''),
            filename: `${sanitizeFilename(title)}.${ext}`,
            platform,
            source: 'yt-dlp',
        };
    }

    throw new Error('Unsupported content type');
}

async function getInfoWithYtDlp(url: string, platform: string): Promise<VideoInfo> {
    const info = await ytdlp.getInfoAsync(url);

    // Handle video type
    if (info._type === 'video') {
        const formats = info.formats || [];

        return {
            id: String(info.id || 'unknown'),
            title: String(info.title || 'Video'),
            description: info.description ? String(info.description) : undefined,
            thumbnail: info.thumbnail ? String(info.thumbnail) : undefined,
            duration: info.duration ? formatDuration(Number(info.duration)) : undefined,
            author: info.uploader ? String(info.uploader) : info.channel ? String(info.channel) : undefined,
            views: info.view_count ? Number(info.view_count) : undefined,
            platform,
            downloadUrl: info.url ? String(info.url) : undefined,
            formats: formats.map((f) => ({
                quality: String(f.format_note || f.resolution || f.format_id || 'unknown'),
                format: String(f.ext || 'mp4'),
                url: String(f.url || ''),
                filesize: f.filesize ? Number(f.filesize) : undefined,
                hasAudio: f.acodec !== 'none',
                hasVideo: f.vcodec !== 'none',
            })),
            source: 'yt-dlp',
        };
    }

    // Handle playlist type
    if (info._type === 'playlist' && info.entries?.length) {
        const firstEntry = info.entries[0];
        return {
            id: String(firstEntry.id || 'unknown'),
            title: String(firstEntry.title || 'Video'),
            platform,
            source: 'yt-dlp',
        };
    }

    throw new Error('Unsupported content type');
}

// ==================== PLATFORM FALLBACKS ====================

async function downloadWithFallback(url: string, platform: Platform): Promise<DownloadResult> {
    switch (platform) {
        case 'youtube':
            return downloadYouTube(url);
        case 'tiktok':
            return downloadTikTok(url);
        case 'instagram':
            return downloadInstagram(url);
        case 'twitter':
            return downloadTwitter(url);
        default:
            throw new Error(`No fallback for platform: ${platform}`);
    }
}

async function getInfoWithFallback(url: string, platform: Platform): Promise<VideoInfo> {
    switch (platform) {
        case 'youtube':
            return getYouTubeInfo(url);
        case 'tiktok':
            return getTikTokInfo(url);
        case 'instagram':
            return getInstagramInfo(url);
        case 'twitter':
            return getTwitterInfo(url);
        default:
            throw new Error(`No fallback for platform: ${platform}`);
    }
}

// ==================== YOUTUBE ====================

async function getYouTubeInfo(url: string): Promise<VideoInfo> {
    const info = await ytdl.getInfo(url);

    return {
        id: info.videoDetails.videoId,
        title: info.videoDetails.title,
        description: info.videoDetails.description || undefined,
        thumbnail: info.videoDetails.thumbnails?.[0]?.url,
        duration: formatDuration(parseInt(info.videoDetails.lengthSeconds)),
        author: info.videoDetails.author?.name,
        views: parseInt(info.videoDetails.viewCount),
        platform: 'youtube',
        formats: info.formats.map((f) => ({
            quality: f.qualityLabel || f.quality || 'unknown',
            format: f.container || 'mp4',
            url: f.url,
            filesize: f.contentLength ? parseInt(f.contentLength) : undefined,
            hasAudio: f.hasAudio || false,
            hasVideo: f.hasVideo || false,
        })),
        source: '@distube/ytdl-core',
    };
}

async function downloadYouTube(url: string): Promise<DownloadResult> {
    const info = await ytdl.getInfo(url);
    const format = info.formats.find((f) => f.hasAudio && f.hasVideo) || info.formats[0];

    return {
        downloadUrl: format.url,
        filename: `${sanitizeFilename(info.videoDetails.title)}.${format.container || 'mp4'}`,
        platform: 'youtube',
        source: '@distube/ytdl-core',
    };
}

// ==================== TIKTOK ====================

async function getTikTokInfo(url: string): Promise<VideoInfo> {
    const result = await TikTokAPI.Downloader(url, { version: 'v3' });

    if (!result || result.status === 'error') {
        throw new Error(result?.message || 'TikTok fetch failed');
    }

    const data = result.result;

    return {
        id: 'tiktok-video',
        title: data?.desc || 'TikTok Video',
        description: data?.desc,
        thumbnail: undefined,
        author: data?.author?.nickname,
        platform: 'tiktok',
        downloadUrl: data?.videoHD || data?.videoSD,
        source: '@tobyg74/tiktok-api-dl',
    };
}

async function downloadTikTok(url: string): Promise<DownloadResult> {
    const result = await TikTokAPI.Downloader(url, { version: 'v3' });

    if (!result || result.status === 'error') {
        throw new Error(result?.message || 'TikTok fetch failed');
    }

    const data = result.result;
    const downloadUrl = data?.videoHD || data?.videoSD || data?.videoWatermark;

    if (!downloadUrl) {
        throw new Error('No download URL found');
    }

    return {
        downloadUrl,
        filename: `tiktok_video.mp4`,
        platform: 'tiktok',
        source: '@tobyg74/tiktok-api-dl',
    };
}

// ==================== INSTAGRAM ====================

async function getInstagramInfo(url: string): Promise<VideoInfo> {
    // Try @mrnima first
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const igModule = require('@mrnima/instagram-downloader');
        const instagramDl = igModule.instagramDl || igModule.default?.instagramDl;

        if (instagramDl) {
            const result = await instagramDl(url);
            if (result?.data) {
                const data = result.data;
                const mediaItems = Array.isArray(data) ? data : [data];
                const firstItem = mediaItems[0];

                return {
                    id: String(data.shortcode || 'unknown'),
                    title: data.caption ? String(data.caption).substring(0, 100) : 'Instagram Post',
                    description: data.caption ? String(data.caption) : undefined,
                    thumbnail: data.thumbnail ? String(data.thumbnail) : undefined,
                    author: data.owner?.username ? String(data.owner.username) : undefined,
                    platform: 'instagram',
                    downloadUrl: firstItem?.url ? String(firstItem.url) : undefined,
                    source: '@mrnima/instagram-downloader',
                };
            }
        }
    } catch {
        // Fall through to priyansh
    }

    // Fallback to priyansh
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const igModule = require('priyansh-ig-downloader');
    const igdl = igModule.igdl || igModule.default?.igdl;

    const result = await igdl(url);

    if (!result?.data) {
        throw new Error('Instagram fetch failed');
    }

    const data = result.data;
    const mediaItems = Array.isArray(data) ? data : [data];
    const firstItem = mediaItems[0];

    return {
        id: 'unknown',
        title: 'Instagram Post',
        platform: 'instagram',
        downloadUrl: firstItem?.url ? String(firstItem.url) : undefined,
        source: 'priyansh-ig-downloader',
    };
}

async function downloadInstagram(url: string): Promise<DownloadResult> {
    const info = await getInstagramInfo(url);

    if (!info.downloadUrl) {
        throw new Error('No download URL found');
    }

    return {
        downloadUrl: info.downloadUrl,
        filename: `instagram_${info.id || 'post'}.mp4`,
        platform: 'instagram',
        source: info.source,
    };
}

// ==================== TWITTER ====================

async function getTwitterInfo(url: string): Promise<VideoInfo> {
    const result = await TwitterDL(url);

    if (!result || result.status === 'error') {
        throw new Error(result?.message || 'Twitter fetch failed');
    }

    const data = result.result;

    let videoUrl: string | undefined;
    if (data?.media?.length) {
        const videoItem = data.media.find((m) => m.type === 'video' || m.type === 'animated_gif');
        if (videoItem?.videos?.length) {
            // Get highest quality video
            const sorted = [...videoItem.videos].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            videoUrl = sorted[0]?.url;
        }
    }

    return {
        id: data?.id || 'unknown',
        title: data?.description?.substring(0, 100) || 'Twitter Video',
        description: data?.description,
        thumbnail: data?.media?.[0]?.cover,
        author: data?.author?.username,
        platform: 'twitter',
        downloadUrl: videoUrl,
        source: 'twitter-downloader',
    };
}

async function downloadTwitter(url: string): Promise<DownloadResult> {
    const info = await getTwitterInfo(url);

    if (!info.downloadUrl) {
        throw new Error('No video found in tweet');
    }

    return {
        downloadUrl: info.downloadUrl,
        filename: `twitter_${info.id || 'video'}.mp4`,
        platform: 'twitter',
        source: info.source,
    };
}
