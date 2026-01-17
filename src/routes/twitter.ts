import { Router, Request, Response } from 'express';
import { downloadVideo, getVideoInfo } from '../services/downloader.service';
import { isValidUrl } from '../utils/helpers';
import { ApiResponse, VideoInfo, DownloadResult } from '../types';

const router = Router();

// POST /api/twitter/info
router.post('/info', async (req: Request, res: Response<ApiResponse<VideoInfo>>) => {
    try {
        const { url } = req.body;

        if (!url || !isValidUrl(url)) {
            return res.status(400).json({ success: false, error: 'Valid URL is required' });
        }

        const info = await getVideoInfo(url, 'twitter');
        return res.json({ success: true, data: info });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get video info';
        return res.status(500).json({ success: false, error: message });
    }
});

// POST /api/twitter/download
router.post('/download', async (req: Request, res: Response<ApiResponse<DownloadResult>>) => {
    try {
        const { url } = req.body;

        if (!url || !isValidUrl(url)) {
            return res.status(400).json({ success: false, error: 'Valid URL is required' });
        }

        const result = await downloadVideo(url, 'twitter');
        return res.json({ success: true, data: result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to download video';
        return res.status(500).json({ success: false, error: message });
    }
});

export default router;
