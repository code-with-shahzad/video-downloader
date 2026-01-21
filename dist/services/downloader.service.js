"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoInfo = getVideoInfo;
const helpers_1 = require("../utils/helpers");
const ytdlp_nodejs_1 = require("ytdlp-nodejs");
const yt_dlp_core_1 = __importDefault(require("yt-dlp-core"));
const tiktok_api_dl_1 = __importDefault(require("@tobyg74/tiktok-api-dl"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const url_1 = require("url");
// @ts-ignore
const filename = (0, url_1.fileURLToPath)(import.meta.url);
const directoryName = path_1.default.dirname(filename);
const COOKIES_PATH = path_1.default.resolve(directoryName, "../../cookies/cookies.txt");
// const HAS_COOKIES = existsSync(COOKIES_PATH);
const BINARY_PATH = (0, fs_1.existsSync)(path_1.default.resolve(directoryName, "../../binary/yt-dlp"))
    ? path_1.default.resolve(directoryName, "../../binary/yt-dlp")
    : (0, fs_1.existsSync)("/usr/local/bin/yt-dlp")
        ? "/usr/local/bin/yt-dlp"
        : "yt-dlp";
const YTDLP_ARGS = [
    '--dump-json',
    '--js-runtimes',
    'node',
    // ...(HAS_COOKIES ? ['--cookies', COOKIES_PATH] : []),
];
const ytDlp = new ytdlp_nodejs_1.YtDlp({
    binaryPath: BINARY_PATH,
});
const ytDlpWrap = new yt_dlp_core_1.default(BINARY_PATH);
async function getVideoInfo(url, fallback) {
    const platform = fallback || (0, helpers_1.detectPlatform)(url) || "unknown";
    try {
        return await getPlatformInfo(url, platform);
    }
    catch {
        let result;
        try {
            result = await getYtDlpInfo(url);
        }
        catch {
            result = await mostPowerFullFnc(url);
        }
        return (0, helpers_1.validateYtdlpResponse)(result);
    }
}
async function mostPowerFullFnc(url) {
    const stdout = await ytDlpWrap.execPromise([url, ...YTDLP_ARGS]);
    return JSON.parse(stdout);
}
async function getPlatformInfo(url, platform) {
    switch (platform) {
        case "youtube":
            const result = await mostPowerFullFnc(url);
            return (0, helpers_1.validateYtdlpResponse)(result);
        case "tiktok":
            return await getTiktokInfo(url);
        case "twitter":
            return await getTwitterInfo(url);
        case "instagram":
            return await getInstagramInfo(url);
        default:
            throw new Error(`Unknown platform: ${platform}`);
    }
}
async function getYtDlpInfo(url) {
    const result = await ytDlp.downloadAsync(url, {
        format: "bestvideo+bestaudio/best",
        dumpSingleJson: true,
        noDownload: true,
        // ...(HAS_COOKIES ? { cookies: COOKIES_PATH } : {}),
    });
    return typeof result === "string" ? JSON.parse(result) : result;
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
        const ApiVersions = ["v2", "v1"];
        let resultData;
        for (const version of ApiVersions) {
            const tiktokDl = await tiktok_api_dl_1.default.Downloader(url, { version });
            const result = tiktokDl.result;
            if (result &&
                ((version === "v2" && result.video?.playAddr) ||
                    (version === "v1" && result.video))) {
                const video = result.video;
                resultData = {
                    url: Array.isArray(video.playAddr) && video.playAddr.length
                        ? video.playAddr[0]
                        : video.playAddr,
                    author: result.author,
                    thumbnail: version === "v2"
                        ? Array.isArray(result.images) && result.images.length
                            ? result.images[0]
                            : result.images
                        : Array.isArray(video.originCover) && video.originCover.length
                            ? video.originCover[0]
                            : video.originCover,
                    type: result.type,
                    statistics: result.statistics,
                    description: result.desc,
                    ...(version === "v1" && { duration: video.duration }),
                };
                break;
            }
            else {
            }
        }
        if (!resultData)
            throw new Error("No valid TikTok result found");
        return resultData;
    }
    catch (err) {
        console.error("TikTok extraction failed:", err);
        return err;
    }
}
//# sourceMappingURL=downloader.service.js.map