import { Router } from 'express';
import { getVideoInfo } from '../services/downloader.service';
import { isBrowserPlayableVideo, isValidUrl } from '../utils/helpers';
const router = Router();
router.post('/info', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !isValidUrl(url)) {
            return res.status(400).json({ success: false, error: 'Valid URL is required' });
        }
        const data = await getVideoInfo(url, 'youtube');
        const isPlayable = await isBrowserPlayableVideo(data?.url);
        if (!data || !data.url || data.url.trim() === '' || data instanceof Error || !isPlayable) {
            return res.status(500).json({ success: false, error: data?.message || 'Failed to get video info' });
        }
        return res.json({ success: true, data });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get video info';
        return res.status(500).json({ success: false, error: message });
    }
});
export default router;
//# sourceMappingURL=youtube.js.map