# 🎧 Wavelength Discord Music Bot

> An enterprise-grade, highly customizable Discord Music Bot powered by **320kbps Master Studio Lossless Audio**, real-time **DSP Audio Filters (8D, Bass Boost, Nightcore, Vaporwave)**, **Spotify & YouTube link resolution**, **Interactive Control Boards**, and **Hydra-style Dedicated Song Request Channels**.

---

## ✨ Features & Capabilities

- 🎵 **320kbps Master Studio Audio Engine**: Direct lossless streaming from Wavelength's CDN with zero ads, high-speed chunk buffering, and instant seeking.
- 🔗 **Universal Link Support**: Supports Spotify tracks, playlists, albums, artist top tracks, YouTube videos, YouTube playlists, SoundCloud, and direct audio streams (`.mp3`, `.aac`, web radio).
- 🎛️ **Hardware-Level DSP Audio Filters**:
  - 🔊 **Bass Boost**: Low (+5dB), Medium (+10dB), High (+15dB)
  - 🎧 **8D Audio**: 360-degree rotating binaural spatial audio
  - ⚡ **Nightcore**: Pitch and tempo acceleration
  - 🌊 **Vaporwave**: Aesthetic slow pitch down
  - 🌧️ **Slowed + Reverb**: Midnight lofi reverberation
  - 🎤 **Karaoke**: Center-channel vocal cancellation
  - 🎚️ **Treble Boost & Tremolo**: Dynamic frequency sculpting
  - 🎛️ **Audio Normalizer**: Dynamic gain leveling across quiet and loud song sections
- 🎛️ **Interactive Discord Control Boards**:
  - Live now-playing embed with dynamic visual progress bar (`🔘━━━━━ 01:24 / 03:45`).
  - Interactive Button row: ⏯️ Play/Pause, ⏭️ Skip, ⏮️ Previous, 🔁 Loop, 🔀 Shuffle, 🔉 Vol-, 🔊 Vol+, 📜 Lyrics, 📻 Autoplay, ⏹️ Stop.
  - Interactive Select Menu for real-time DSP filter switching.
- 📻 **Intelligent Autoplay (Radio Mode)**: When the queue concludes, the bot automatically resolves and plays similar tracks by the same artist/genre forever.
- 💬 **Dedicated Song Request Channel (Hydra-Style)**: Run `/setup` to automatically create a `#wavelength-music` channel. Users simply type a song title or paste a link into that channel; the bot automatically deletes their message and updates the pinned player dashboard!
- 📜 **Synchronized Lyrics**: Run `/lyrics` to view synchronized or plain lyrics directly inside Discord.
- 📂 **Custom Personal Playlists**: Save your active queue with `/playlist save <name>` and play it anytime with `/playlist play <name>`.
- ⏰ **24/7 Voice Channel Mode**: Keep the bot in voice channels indefinitely with `/247`.
- 🛡️ **DJ Moderation & Server Settings**: Configure DJ roles, default volume, prefixes, and timeouts.

---

## 🚀 Quick Setup & Installation

### 1. Create Your Discord Bot Application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and name it `Wavelength`.
3. Navigate to the **Bot** tab:
   - Click **Reset Token** and copy your **Bot Token**.
   - Under **Privileged Gateway Intents**, enable:
     - ✅ **Presence Intent**
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent**
4. Navigate to **OAuth2 -> URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Administrator` (or `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Manage Messages`, `Manage Channels`)
   - Copy the generated URL and invite the bot to your Discord server.

---

### 2. Configure Environment Variables
Inside `discord-bot/`, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
DEFAULT_PREFIX=!w
DEFAULT_VOLUME=80
```

---

### 3. Register Slash Commands
Run the command deployer to register all (/) slash commands with Discord globally:
```bash
npm run deploy:commands
```

---

### 4. Start the Bot
**For Development:**
```bash
npm run dev
```

**For Production:**
```bash
npm run build
npm start
```

---

## 🐳 Docker Deployment

The bot can be deployed as an isolated Docker container with persistent data storage:

```bash
docker build -t wavelength-discord-bot .
docker run -d --name wavelength-bot --restart unless-stopped \
  --env-file .env \
  -v wavelength_bot_data:/app/data \
  wavelength-discord-bot
```

Or run via the monorepo `docker-compose.yml`:
```bash
docker compose up -d discord-bot
```

---

## 📜 Full Command Reference

| Category | Command | Description |
| :--- | :--- | :--- |
| **Playback** | `/play <query>` | Play a song, playlist, Spotify URL, YouTube link, or direct stream |
| | `/pause` | Pause active audio playback |
| | `/resume` | Resume paused playback |
| | `/skip` | Skip to the next queued song |
| | `/previous` | Replay the previous song |
| | `/stop` | Stop playback, clear queue, and leave voice channel |
| | `/nowplaying` | Open interactive player embed with buttons and filter menu |
| | `/lyrics [song]` | Display synchronized lyrics for current or specified track |
| | `/autoplay` | Toggle smart continuous radio mode |
| **Queue** | `/queue [page]` | View paginated queue with track durations and total time |
| | `/volume <1-150>` | Change playback volume level |
| | `/seek <time>` | Jump to exact timestamp (e.g. `1:30` or `90`) |
| | `/loop <mode>` | Cycle repeat mode (`off`, `track`, `queue`) |
| | `/shuffle` | Randomize queue order |
| | `/history` | View the last 15 songs played in this server |
| | `/save` | Send current song details to your private DMs |
| **Filters** | `/filter <effect>` | Apply DSP effects (8D, Bass Boost, Nightcore, Vaporwave, etc.) |
| **Settings** | `/setup` | Automatically create a dedicated song-request channel |
| | `/247` | Toggle 24/7 Voice Channel Stay Mode |
| | `/playlist <save\|play\|list\|delete>` | Manage personal custom playlists |
| | `/settings` | Configure default volume, prefix, and DJ roles |
| **Utility** | `/help` | Display interactive command manual |
| | `/ping` | Test WebSocket latency and heartbeat |
| | `/stats` | View RAM usage, uptime, active servers, and voice players |
