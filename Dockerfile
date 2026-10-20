# ============================================================================
# Dijital Düğün Davetiyesi — Docker Kurulumu (Raspberry Pi 4B / ARM64 & AMD64)
# ============================================================================

# 1. Aşama: Frontend Build (React + TypeScript + Tailwind v4)
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN npm run build

# 2. Aşama: Hafif Canlı Yayın Sunucusu (Sıfır ek bağımlılık, ~40MB RAM kullanımı)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4173
ENV HOST=0.0.0.0
ENV TZ=Europe/Istanbul

COPY package.json ./
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY src/data ./src/data

RUN mkdir -p /app/data /app/uploads

VOLUME ["/app/data", "/app/uploads"]

EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4173/api/state > /dev/null || exit 1

CMD ["node", "server/index.mjs"]
