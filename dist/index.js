"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const youtube_1 = __importDefault(require("./routes/youtube"));
const tiktok_1 = __importDefault(require("./routes/tiktok"));
const instagram_1 = __importDefault(require("./routes/instagram"));
const twitter_1 = __importDefault(require("./routes/twitter"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// Routes - Only /info endpoints
app.use('/api/youtube', youtube_1.default);
app.use('/api/tiktok', tiktok_1.default);
app.use('/api/instagram', instagram_1.default);
app.use('/api/twitter', twitter_1.default);
// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║       🎬 Video Downloader API              ║
╠════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}              ║
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
exports.default = app;
//# sourceMappingURL=index.js.map