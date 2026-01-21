import { detectPlatform, validateYtdlpResponse } from "../utils/helpers";
import { YtDlp } from "ytdlp-nodejs";
import YTDlpWrap from "yt-dlp-core";
import TikTokAPI from "@tobyg74/tiktok-api-dl";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

// @ts-ignore
const filename = fileURLToPath(import.meta.url);
const directoryName = path.dirname(filename); 

const COOKIES_PATH = path.resolve(directoryName, "../../cookies/cookies.txt");
// const HAS_COOKIES = existsSync(COOKIES_PATH);

const BINARY_PATH = existsSync(path.resolve(directoryName, "../../binary/yt-dlp"))
  ? path.resolve(directoryName, "../../binary/yt-dlp")
  : existsSync("/usr/local/bin/yt-dlp")
  ? "/usr/local/bin/yt-dlp"
  : "yt-dlp";

const YTDLP_ARGS = [
  '--dump-json',
  '--js-runtimes',
  'node',
  // ...(HAS_COOKIES ? ['--cookies', COOKIES_PATH] : []),
];

const ytDlp = new YtDlp({
  binaryPath: BINARY_PATH,
});

const ytDlpWrap = new YTDlpWrap(BINARY_PATH);

export async function getVideoInfo(
  url: string,
  fallback?: string,
): Promise<unknown> {
  const platform = fallback || detectPlatform(url) || "unknown";
  try {
    return await getPlatformInfo(url, platform);
  } catch {
    let result;
    try {
      result = await getYtDlpInfo(url);
    } catch{
      result = await mostPowerFullFnc(url)
    }
    return validateYtdlpResponse(result);
  }
}

async function mostPowerFullFnc(url:string){
   const stdout = await ytDlpWrap.execPromise([url,...YTDLP_ARGS])
   return JSON.parse(stdout)
}

async function getPlatformInfo(
  url: string,
  platform: string,
): Promise<unknown> {
  switch (platform) {
    case "youtube":
      const result = await mostPowerFullFnc(url)
      return validateYtdlpResponse(result);
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

async function getYtDlpInfo(url: string): Promise<unknown> {
  const result = await ytDlp.downloadAsync(url, {
    format: "bestvideo+bestaudio/best",
    dumpSingleJson: true,
    noDownload: true,
    // ...(HAS_COOKIES ? { cookies: COOKIES_PATH } : {}),
  });
  return typeof result === "string" ? JSON.parse(result) : result;
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
  const ApiVersions: ("v2" | "v1")[] = ["v2", "v1"];
  let resultData;

  for (const version of ApiVersions) {
    const tiktokDl = await TikTokAPI.Downloader(url, { version });
    const result = tiktokDl.result;

    if (
      result &&
      ((version === "v2" && result.video?.playAddr) ||
        (version === "v1" && result.video))
    ) {
      const video = result.video as any;

      resultData = {
        url: Array.isArray(video.playAddr) && video.playAddr.length
          ? video.playAddr[0]
          : video.playAddr,
        author: result.author,
        thumbnail:
          version === "v2"
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
    } else {
      
    }
  }

  if (!resultData) throw new Error("No valid TikTok result found");

  return resultData;
} catch (err) {
  console.error("TikTok extraction failed:", err);
  return err;
}

}
