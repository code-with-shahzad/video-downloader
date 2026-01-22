# Simple & Strong Dockerfile for Video Downloader API
FROM node:20-alpine

# Install yt-dlp globally + ffmpeg + python + canvas build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    # Build tools for native modules
    build-base \
    pkgconfig \
    # Canvas dependencies
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev \
    && pip3 install --break-system-packages yt-dlp \
    && yt-dlp --version

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Run the app
CMD ["node", "dist/index.js"]
