import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import youtubeRoutes from './routes/youtube.js';
import tiktokRoutes from './routes/tiktok.js';
import instagramRoutes from './routes/instagram.js';
import twitterRoutes from './routes/twitter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes - Only /info endpoints
app.use('/api/youtube', youtubeRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/twitter', twitterRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║       🎬 Video Downloader API              ║
╠════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}          ║
║                                            ║
║  Endpoints:                                ║
║    POST /api/youtube/info                  ║
║    POST /api/tiktok/info                   ║
║    POST /api/instagram/info                ║
║    POST /api/twitter/info                  ║
║                                            ║
║  Body: { "url": "VIDEO_URL" }              ║
╚════════════════════════════════════════════╝
`);
});

export default app;
