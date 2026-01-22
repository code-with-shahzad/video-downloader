# Simple & Strong Dockerfile for Video Downloader API

# ========== BUILD STAGE ==========
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source and build TypeScript
COPY . .
RUN npm run build

# ========== PRODUCTION STAGE ==========
FROM node:20-alpine

# Install yt-dlp globally + ffmpeg + python + canvas dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    build-base \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev \
    && pip3 install --break-system-packages yt-dlp \
    && yt-dlp --version

WORKDIR /app

# Copy package files and install production only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy cookies and binary folders if needed
COPY cookies ./cookies
COPY binary ./binary

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Run the app
CMD ["node", "dist/index.js"]
