import { detectPlatform } from '../utils/helpers';
import { YtDlp } from 'ytdlp-nodejs';
import TikTokAPI from '@tobyg74/tiktok-api-dl';
import { TwitterDL } from 'twitter-downloader';
import ytdl from '@distube/ytdl-core';

const ytDlp = new YtDlp();

export async function getVideoInfo(url: string, fallback?: string): Promise<unknown> {
    const platform = fallback || detectPlatform(url) || 'unknown';

    try {
        const result = await ytDlp.downloadAsync(url, {
            format: 'bestvideo+bestaudio/best',
            dumpSingleJson: true,
            noDownload: true,
        });
        return typeof result === 'string' ? JSON.parse(result) : result;
    } catch {
        return await getFallbackInfo(url, platform);
    }
}

async function getFallbackInfo(url: string, platform: string): Promise<unknown> {
    switch (platform) {
        case 'youtube':
            return await ytdl.getInfo(url);
        case 'tiktok':
            return await TikTokAPI.Downloader(url, { version: 'v3' });
        case 'twitter':
            return await TwitterDL(url);
        case 'instagram':
            return await getInstagramInfo(url);
        default:
            throw new Error(`No fallback for platform: ${platform}`);
    }
}

async function getInstagramInfo(url: string): Promise<unknown> {
    try {
        const igModule = require('@mrnima/instagram-downloader');
        const instagramDl = igModule.instagramDl || igModule.default?.instagramDl;
        if (instagramDl) {
            return await instagramDl(url);
        }
    } catch { }
    const igModule = require('priyansh-ig-downloader');
    const igdl = igModule.igdl || igModule.default?.igdl;
    return await igdl(url);
}
