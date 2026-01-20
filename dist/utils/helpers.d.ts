import { Platform } from '../types';
/**
 * Detects the platform from a URL
 */
export declare function detectPlatform(url: string): Platform | null;
/**
 * Validates URL format
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Formats duration from seconds to HH:MM:SS or MM:SS
 */
export declare function formatDuration(seconds: number): string;
/**
 * Sanitizes filename for safe file system usage
 */
export declare function sanitizeFilename(filename: string): string;
export declare const validateYtdlpResponse: (result: any) => {
    url: any;
    title: any;
    description: any;
    duration: any;
    author: {
        uuid: any;
        username: any;
        nickname: any;
        url: any;
    };
    thumbnail: any;
    type: any;
    statistics: {
        playCount: any;
        likesCount: any;
        commentCount: any;
        shareCount: any;
    };
    download_data: {
        url: any;
        format: any;
    };
};
//# sourceMappingURL=helpers.d.ts.map