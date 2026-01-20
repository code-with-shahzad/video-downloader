"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const downloader_service_1 = require("../services/downloader.service");
const helpers_1 = require("../utils/helpers");
const router = (0, express_1.Router)();
router.post('/info', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !(0, helpers_1.isValidUrl)(url)) {
            return res.status(400).json({ success: false, error: 'Valid URL is required' });
        }
        const data = await (0, downloader_service_1.getVideoInfo)(url, 'instagram');
        return res.json({ success: true, data });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get video info';
        return res.status(500).json({ success: false, error: message });
    }
});
exports.default = router;
//# sourceMappingURL=instagram.js.map