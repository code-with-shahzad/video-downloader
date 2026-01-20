"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoInfo = getVideoInfo;
const helpers_1 = require("../utils/helpers");
const ytdlp_nodejs_1 = require("ytdlp-nodejs");
const tiktok_api_dl_1 = __importDefault(require("@tobyg74/tiktok-api-dl"));
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const ytDlp = new ytdlp_nodejs_1.YtDlp();
async function getVideoInfo(url, fallback) {
    const platform = fallback || (0, helpers_1.detectPlatform)(url) || 'unknown';
    try {
        return await getPlatformInfo(url, platform);
    }
    catch {
        const result = await getYtDlpInfo(url);
        return (0, helpers_1.validateYtdlpResponse)(result);
    }
}
async function getPlatformInfo(url, platform) {
    switch (platform) {
        case 'youtube':
            return await ytdl_core_1.default.getInfo(url);
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
async function getYtDlpInfo(url) {
    const result = await ytDlp.downloadAsync(url, {
        format: 'bestvideo+bestaudio/best',
        dumpSingleJson: true,
        noDownload: true,
    });
    return typeof result === 'string' ? JSON.parse(result) : result;
}
async function getInstagramInfo(url) {
    const response = await getYtDlpInfo(url);
    return (0, helpers_1.validateYtdlpResponse)(response);
}
async function getTwitterInfo(url) {
    const response = await getYtDlpInfo(url);
    return (0, helpers_1.validateYtdlpResponse)(response);
}
async function getTiktokInfo(url) {
    try {
        const tiktokDl = await tiktok_api_dl_1.default.Downloader(url, { version: 'v1' });
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
    }
    catch {
        const tiktokDl = await tiktok_api_dl_1.default.Downloader(url, { version: 'v2' });
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
//# sourceMappingURL=downloader.service.js.map