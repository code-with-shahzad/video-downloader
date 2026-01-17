// Type declarations for packages without types

declare module '@mrnima/instagram-downloader' {
    interface InstagramResult {
        data?: {
            shortcode?: string;
            caption?: string;
            thumbnail?: string;
            owner?: { username: string };
            url?: string;
        } | Array<{ url?: string; type?: string }>;
    }

    export function instagramDl(url: string): Promise<InstagramResult>;
}

declare module 'priyansh-ig-downloader' {
    interface IgResult {
        data?: {
            url?: string;
            type?: string;
        } | Array<{ url?: string; type?: string }>;
    }

    export function igdl(url: string): Promise<IgResult>;
}
