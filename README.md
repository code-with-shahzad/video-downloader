# Video Downloader API

A clean Express.js server for downloading videos from YouTube, TikTok, Instagram, and Twitter.

## 🎯 Strategy

```
downloadVideo(url, fallback?)
  1. Try yt-dlp first (works for ALL platforms)
  2. If fails & fallback specified → use platform-specific package
```

## 📁 Project Structure

```
src/
├── index.ts                    # Express server
├── types/
│   └── index.ts                # TypeScript types
├── routes/
│   ├── youtube.ts              # /api/youtube/*
│   ├── tiktok.ts               # /api/tiktok/*
│   ├── instagram.ts            # /api/instagram/*
│   └── twitter.ts              # /api/twitter/*
├── services/
│   └── downloader.service.ts   # Global download functions
└── utils/
    └── helpers.ts              # Utility functions
```

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 📡 API Endpoints

### Universal (Auto-detect platform)
| Endpoint | Description |
|----------|-------------|
| `POST /api/info` | Get video info |
| `POST /api/download` | Get download URL |

### Platform-Specific
| Platform | Info | Download |
|----------|------|----------|
| YouTube | `POST /api/youtube/info` | `POST /api/youtube/download` |
| TikTok | `POST /api/tiktok/info` | `POST /api/tiktok/download` |
| Instagram | `POST /api/instagram/info` | `POST /api/instagram/download` |
| Twitter | `POST /api/twitter/info` | `POST /api/twitter/download` |

## 📝 Request/Response

**Request:**
```json
{
  "url": "https://youtube.com/watch?v=xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "xxxxx",
    "title": "Video Title",
    "downloadUrl": "https://...",
    "platform": "youtube",
    "source": "yt-dlp"
  }
}
```

## 🔄 Fallback Chain

| Platform | Primary | Fallback |
|----------|---------|----------|
| YouTube | yt-dlp | @distube/ytdl-core |
| TikTok | yt-dlp | @tobyg74/tiktok-api-dl |
| Instagram | yt-dlp | @mrnima/instagram-downloader → priyansh-ig-downloader |
| Twitter | yt-dlp | twitter-downloader |

## 💡 Usage Examples

```bash
# YouTube
curl -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'

# Universal (auto-detect)
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tiktok.com/@user/video/123"}'
```
