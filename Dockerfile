# Multi-stage build for production-ready video-downloader
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies: Python3, ffmpeg, and required tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates

# Install yt-dlp globally
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Copy service files from root (optional, will fallback to global yt-dlp)
COPY binary ./binary 2>/dev/null || true
COPY cookies ./cookies 2>/dev/null || true

# Ensure yt-dlp binary is executable if it exists
RUN chmod +x binary/yt-dlp 2>/dev/null || true

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/youtube/info', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
