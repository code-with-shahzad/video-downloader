import { Router, Request, Response } from 'express';
import { getVideoInfo } from '../services/downloader.service.js';
import { isBrowserPlayableVideo, isValidUrl } from '../utils/helpers.js';

const router = Router();

router.post('/info', async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        if (!url || !isValidUrl(url)) {
            return res.status(400).json({ success: false, error: 'Valid URL is required' });
        }
        const data: any = await getVideoInfo(url, 'instagram');
        const isPlayable = await isBrowserPlayableVideo(data?.url);
        if(!data || !data.url || data.url.trim() === '' ||  data instanceof Error || !isPlayable){  
            return res.status(500).json({ success: false, error: data?.message || 'Failed to get video info' });
        }
        return res.json({ success: true, data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get video info';
        return res.status(500).json({ success: false, error: message });
    }
});

export default router;
