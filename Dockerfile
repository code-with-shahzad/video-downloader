FROM node:20-alpine AS builder

RUN apk add --no-cache \
    python3 \
    build-base \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

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

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY public ./public

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Run the app
CMD ["node", "dist/index.js"]
