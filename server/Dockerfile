# Camping Shop API — Dockerfile (dùng cho Northflank / Render / Fly.io...).
# Build context là thư mục server/ (repo root có cả app/ + server/).
# Chạy: docker build -t camping-shop-api . && docker run -p 3001:3001 --env-file .env camping-shop-api
FROM node:20-alpine

WORKDIR /app

# Cài dependencies trước để tận dụng cache layer.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy code (không copy .env — biến môi trường do nền tảng cấp).
COPY server.js ./
COPY src ./src

# Chạy bằng user node (không dùng root trong container).
USER node

# Northflank/Render cấp PORT qua biến môi trường; code đọc process.env.PORT.
EXPOSE 3001

CMD ["node", "server.js"]
