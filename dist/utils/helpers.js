/**
 * Detects the platform from a URL
 */
export function detectPlatform(url) {
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
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Formats duration from seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds) {
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
export function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}
const validateDownloadResponse = (formats) => {
    if (!formats?.length)
        return { url: null, format: [] };
    const videoExts = ["mp4", "webm", "mov"];
    const videoFormats = formats.filter((f) => videoExts.includes(f?.ext) && f?.vcodec !== 'none');
    const bestVideo = videoFormats.sort((a, b) => (b?.width || 0) - (a?.width || 0))[0];
    return {
        url: bestVideo?.url || formats[0]?.url || null,
        format: formats.map((item) => ({
            url: item?.url || null,
            type: item?.vcodec !== 'none' ? "video" : "audio",
            resolution: item?.resolution,
            ext: item?.ext,
        })),
    };
};
export const validateYtdlpResponse = (result) => {
    const downloadData = validateDownloadResponse(result?.formats || result?.requested_downloads);
    return {
        url: downloadData?.url || result?.url,
        title: result?.title,
        description: result?.description,
        duration: result?.duration,
        author: {
            uuid: result?.uploader_id,
            username: result?.uploader,
            nickname: result?.channel,
            url: result?.uploader_url,
        },
        thumbnail: result?.thumbnails?.[0]?.url || result?.thumbnail,
        type: result?._type || 'video',
        statistics: {
            playCount: result?.view_count,
            likesCount: result?.like_count,
            commentCount: result?.comment_count,
            shareCount: result?.repost_count
        },
        download_data: downloadData,
    };
};
export async function isBrowserPlayableVideo(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, {
            headers: {
                Range: "bytes=0-1023",
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (![200, 206].includes(res.status))
            return false;
        const type = res.headers.get("content-type") || "";
        const isVideo = type.startsWith("video/") ||
            type === "application/octet-stream";
        if (!isVideo)
            return false;
        const buf = Buffer.from(await res.arrayBuffer());
        return (buf.includes(Buffer.from("ftyp")) ||
            buf.includes(Buffer.from("webm")) ||
            buf.includes(Buffer.from("OggS")));
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=helpers.js.map