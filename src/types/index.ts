// Supported platforms
export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'twitter';

// Video information returned by all services
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

// Video format/quality options
export interface VideoFormat {
    quality: string;
    format: string;
    url: string;
    filesize?: number;
    hasAudio: boolean;
    hasVideo: boolean;
}

// Download result
export interface DownloadResult {
    downloadUrl: string;
    filename: string;
    platform: Platform | string;
    source: string;
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Request body types
export interface InfoRequest {
    url: string;
}

export interface DownloadRequest {
    url: string;
    quality?: string;
}
