export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'twitter';
export interface VideoInfo {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    duration?: string;
    author?: string;
    views?: number;
    platform: Platform | string;
    downloadUrl?: string;
    formats?: VideoFormat[];
    source: string;
}
export interface VideoFormat {
    quality: string;
    format: string;
    url: string;
    filesize?: number;
    hasAudio: boolean;
    hasVideo: boolean;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map