import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Routes
import youtubeRoutes from './routes/youtube';
import tiktokRoutes from './routes/tiktok';
import instagramRoutes from './routes/instagram';
import twitterRoutes from './routes/twitter';

// Services & Utils
import { downloadVideo, getVideoInfo } from './services/downloader.service';
import { isValidUrl, detectPlatform } from './utils/helpers';
import { ApiResponse, VideoInfo, DownloadResult, Platform } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ==================== PLATFORM-SPECIFIC ROUTES ====================
app.use('/api/youtube', youtubeRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/twitter', twitterRoutes);

// ==================== UNIVERSAL ENDPOINTS ====================

// POST /api/info - Auto-detect platform
app.post('/api/info', async (req: Request, res: Response<ApiResponse<VideoInfo>>) => {
    try {
        const { url, platform } = req.body as { url: string; platform?: Platform };

        if (!url || !isValidUrl(url)) {
            return res.status(400).json({ success: false, error: 'Valid URL is required' });
        }

        const detectedPlatform = platform || detectPlatform(url);
        console.log(`\n📥 [Info] URL: ${url}`);
        console.log(`🔍 [Info] Platform: ${detectedPlatform || 'auto'}`);

        const info = await getVideoInfo(url, detectedPlatform || undefined);
        return res.json({ success: true, data: info });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get video info';
        console.error(`❌ [Info] Error: ${message}`);
        return res.status(500).json({ success: false, error: message });
    }
});

// POST /api/download - Auto-detect platform
app.post('/api/download', async (req: Request, res: Response<ApiResponse<DownloadResult>>) => {
    try {
        const { url, platform } = req.body as { url: string; platform?: Platform };

        if (!url || !isValidUrl(url)) {
            return res.status(400).json({ success: false, error: 'Valid URL is required' });
        }

        const detectedPlatform = platform || detectPlatform(url);
        console.log(`\n📥 [Download] URL: ${url}`);
        console.log(`🔍 [Download] Platform: ${detectedPlatform || 'auto'}`);

        const result = await downloadVideo(url, detectedPlatform || undefined);
        return res.json({ success: true, data: result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to download video';
        console.error(`❌ [Download] Error: ${message}`);
        return res.status(500).json({ success: false, error: message });
    }
});

// ==================== HEALTH & DOCS ====================

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (_req: Request, res: Response) => {
    res.json({
        name: 'Video Downloader API',
        version: '1.0.0',
        strategy: 'yt-dlp first → platform-specific fallback',
        endpoints: {
            universal: {
                info: 'POST /api/info',
                download: 'POST /api/download',
            },
            youtube: {
                info: 'POST /api/youtube/info',
                download: 'POST /api/youtube/download',
            },
            tiktok: {
                info: 'POST /api/tiktok/info',
                download: 'POST /api/tiktok/download',
            },
            instagram: {
                info: 'POST /api/instagram/info',
                download: 'POST /api/instagram/download',
            },
            twitter: {
                info: 'POST /api/twitter/info',
                download: 'POST /api/twitter/download',
            },
        },
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║            🎬 Video Downloader API                        ║
╠═══════════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                             ║
║                                                           ║
║  Universal Endpoints:                                     ║
║    POST /api/info      - Get video info                   ║
║    POST /api/download  - Download video                   ║
║                                                           ║
║  Platform Endpoints:                                      ║
║    /api/youtube/info   /api/youtube/download              ║
║    /api/tiktok/info    /api/tiktok/download               ║
║    /api/instagram/info /api/instagram/download            ║
║    /api/twitter/info   /api/twitter/download              ║
║                                                           ║
║  Strategy: yt-dlp first → platform fallback               ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
