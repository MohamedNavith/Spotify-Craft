FROM node:20-bullseye-slim

WORKDIR /app

# Install system utilities needed for native voice libraries and audio decoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    python3 \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Create data directory for persistent settings & playlists
RUN mkdir -p /app/data

VOLUME ["/app/data"]

ENV NODE_ENV=production

CMD ["npm", "start"]
