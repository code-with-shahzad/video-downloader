import { detectPlatform, validateYtdlpResponse } from '../utils/helpers';
import { YtDlp } from 'ytdlp-nodejs';
import TikTokAPI from '@tobyg74/tiktok-api-dl';
import ytdl from '@distube/ytdl-core';

const ytDlp = new YtDlp();

export async function getVideoInfo(url: string, fallback?: string): Promise<unknown> {
    const platform = fallback || detectPlatform(url) || 'unknown';
    try {
        return await getPlatformInfo(url, platform);
    } catch {
        const result = await getYtDlpInfo(url);
        return validateYtdlpResponse(result);
    }
}

async function getPlatformInfo(url: string, platform: string): Promise<unknown> {
    switch (platform) {
        case 'youtube':
            return await ytdl.getInfo(url);
        case 'tiktok':
            return await getTiktokInfo(url);
        case 'twitter':
            return await getTwitterInfo(url);
        case 'instagram':
            return await getInstagramInfo(url);
        default:
            throw new Error(`Unknown platform: ${platform}`);
    }
}

async function getYtDlpInfo(url: string): Promise<unknown> {
    const result = await ytDlp.downloadAsync(url, {
        format: 'bestvideo+bestaudio/best',
        dumpSingleJson: true,
        noDownload: true,
    });
    return typeof result === 'string' ? JSON.parse(result) : result;
}

async function getInstagramInfo(url: string): Promise<unknown> {
    const response = await getYtDlpInfo(url);
    return validateYtdlpResponse(response);
}

async function getTwitterInfo(url: string): Promise<unknown> {
    const response = await getYtDlpInfo(url);
    return validateYtdlpResponse(response);
}


async function getTiktokInfo(url: string): Promise<unknown> {
    try {
        const tiktokDl = await TikTokAPI.Downloader(url, { version: 'v1' });
        const result = tiktokDl.result;
        return {
            url: result?.video?.playAddr?.length ? result?.video?.playAddr[0] : result?.video?.playAddr,
            author: result?.author,
            thumbnail: result?.video?.originCover?.length ? result?.video?.originCover[0] : result?.video?.originCover,
            type: result?.type,
            statistics: result?.statistics,
            description: result?.desc,
            duration: result?.video?.duration,
        };
    } catch {
        const tiktokDl = await TikTokAPI.Downloader(url, { version: 'v2' });
        const result = tiktokDl.result;
        return {
            url: result?.video?.playAddr?.length ? result?.video?.playAddr[0] : result?.video?.playAddr,
            author: result?.author,
            thumbnail: result?.images?.length ? result?.images[0] : result?.images,
            type: result?.type,
            statistics: result?.statistics,
            description: result?.desc,
        };
    }
}

