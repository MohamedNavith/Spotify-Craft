# Wavelength 🎧 (Spotify-Craft)

> A production-grade, multi-platform Spotify Web Player ecosystem (**Website**, **Android APK**, and **Windows PC Desktop App**) powered by Next.js 15, NestJS, and legal, licensed audio streaming providers.

[![Deploy Wavelength to GitHub Pages](https://github.com/MohamedNavith/Spotify-Craft/actions/workflows/deploy.yml/badge.svg)](https://github.com/MohamedNavith/Spotify-Craft/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Design Benchmark](https://img.shields.io/badge/UI_Benchmark-Spotify_Web_Player-1ed760.svg)](https://open.spotify.com/)

---

## 🌐 Live Web App

The live application is hosted on GitHub Pages:
👉 **[https://mohamednavith.github.io/Spotify-Craft/](https://mohamednavith.github.io/Spotify-Craft/)**

---

## 📥 Downloads & Releases

Get the latest production builds from [GitHub Releases v1.3.0](https://github.com/MohamedNavith/Spotify-Craft/releases/tag/v1.3.0):

| Target | File | Size | Description | Download Link |
| :--- | :--- | :--- | :--- | :--- |
| **Android Phone / Tablet** | `wavelength-mobile.apk` | ~4.5 MB | Standalone Android APK with native lock screen & notification media controls | [⬇️ Download APK (v1.3.0)](https://github.com/MohamedNavith/Spotify-Craft/releases/download/v1.3.0/wavelength-mobile.apk) |
| **Windows PC (Installer)** | `wavelength-desktop.exe` | ~180 MB | Standalone Windows application binary with global media keys | [⬇️ Download EXE (v1.3.0)](https://github.com/MohamedNavith/Spotify-Craft/releases/download/v1.3.0/wavelength-desktop.exe) |
| **Windows PC (Portable)** | `wavelength-windows-x64.zip` | ~366 MB | Portable unpack & run folder (`wavelength-desktop.exe`) | [⬇️ Download ZIP (v1.3.0)](https://github.com/MohamedNavith/Spotify-Craft/releases/download/v1.3.0/wavelength-windows-x64.zip) |
| **Web Browser (PWA)** | Web Application | Cloud | Live everywhere without installation or localhost | [🌐 Launch Web Player](https://mohamednavith.github.io/Spotify-Craft/) |

---

## 🌟 Key Features in v1.3.0

- **Android Lock Screen & Quick Settings Notification Controls**:
  - Full Android system media tile with active playback state, title, artist, high-res artwork, previous/play/pause/next, and position scrubber.
- **Full Song Playback by Default**:
  - Every selected track automatically resolves the complete 3–5 minute full studio version; 30-second preview mode is strictly an optional manual toggle.
- **Top Centric-Left Spotify Search Bar with Live Autocomplete**:
  - Official Spotify Web layout with a search input positioned in the top navigation bar.
  - 200ms debounced live dropdown displaying matching songs, artists, thumbnails, and 1-click play buttons.
- **Authentic Spotify Lyrics Typography**:
  - Left-aligned, heavy bold sans-serif styling matching the official Spotify client.
  - Active line text shadow glow, soft inactive blur, and automatic smooth vertical scrolling.
- **Fixed Official Video Mode**:
  - Direct video ID resolver overcoming YouTube's deprecation of `listType=search`.
  - Floating Picture-in-Picture window with full playback synchronization.
- **Listening History & Recently Played**:
  - Dedicated `/history` page and Home shelf tracking your listening journey with one-click "Play All".
- **Settings & Favorite Artists System**:
  - Dedicated `/settings` page allowing users to select favorite singers (Anirudh, A.R. Rahman, Arijit Singh, Taylor Swift, Billie Eilish, Bruno Mars, etc.).
  - "Recommended Based on Your Favorites" dynamic shelf on Home.
  - 320kbps high-fidelity streaming quality setting.
- **Popular Artists Shelf**:
  - Circular artist portraits with hover green play button matching the Spotify Web Home page.

---

## 📱 Multi-Platform Support

| Platform | Technology | Target Output | Run Command |
| :--- | :--- | :--- | :--- |
| **Website** | Next.js 15, Tailwind, Zustand, Web Audio | Web / PWA | `npm --prefix frontend run dev` |
| **Windows PC** | Electron 33, Native Media Shortcuts | `.exe` Desktop App | `npm run desktop` |
| **Mobile** | Capacitor 6, Android SDK, Gradle | `.apk` Android App | `cd mobile && npm run build:apk` |

---

## 🏗 Architecture & Stack

```
wavelength/
├── backend/                  # NestJS TypeScript API
│   ├── src/
│   │   ├── auth/             # JWT auth with OWASP refresh token rotation
│   │   ├── providers/        # MusicProvider abstraction & adapters
│   │   │   ├── jamendo/      # Jamendo v3.0 REST API adapter
│   │   │   ├── audius/       # Audius open protocol adapter
│   │   │   ├── archive/      # Internet Archive public domain adapter
│   │   │   └── spotify/      # Spotify Web Playback SDK adapter
│   │   ├── lyrics/           # LRCLIB time-synced lyrics integration
│   │   ├── playlists/        # Playlist management & library
│   │   └── database/         # Prisma ORM (PostgreSQL + In-memory fallback)
├── frontend/                 # Next.js 15 (App Router) Spotify UI
│   ├── src/
│   │   ├── app/              # Home, Search, Wrapped, Podcasts, Jam, Upload
│   │   ├── components/       # PlayerBar, AudioEngine, LyricsModal, Equalizer, Queue
│   │   ├── stores/           # Zustand player & auth global stores
├── desktop/                  # Electron Windows wrapper with media keys
├── mobile/                   # Capacitor configuration for Android APK
├── docker-compose.yml        # PostgreSQL, Redis, Meilisearch, MinIO, Backend, Frontend
└── .github/workflows/        # Automated GitHub Pages CI/CD deployment
```

---

## 🎵 Unified MusicProvider Abstraction

All streaming sources conform to a strict interface:

```typescript
export interface MusicProvider {
  readonly id: ProviderName;
  readonly name: string;
  readonly isEnabled: boolean;
  search(query: string, options?: SearchOptions): Promise<UnifiedSearchResult>;
  getTrack(id: string): Promise<UnifiedTrack>;
  getPlayback(id: string): Promise<UnifiedPlayback>;
  getArtist(id: string): Promise<UnifiedArtist>;
  getAlbum(id: string): Promise<UnifiedAlbum>;
}
```

The `ProviderRegistryService` fans out search requests across all enabled providers concurrently via `Promise.allSettled`, isolates errors, deduplicates tracks by ISRC or normalized `(title + artist)`, and returns a unified result catalog.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher
- *(Optional)* Docker & Docker Compose for containerized PostgreSQL, Redis, and MinIO.

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Running with Docker Compose (Full Stack)
```bash
docker compose up --build -d
```

### 4. Running Locally in Development Mode

#### Start Backend:
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```
Backend runs at `http://localhost:4000`.

#### Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3001`.

#### Run Desktop App (Windows):
```bash
npm run desktop
```

#### Run Backend Unit Tests:
```bash
cd backend
npm test
```

---

## 🔑 API Keys & Secrets

| Provider / Service | Required? | Default in Repo | How to Obtain / Configure |
| :--- | :--- | :--- | :--- |
| **Jamendo Music** | No | Pre-configured (`17ed92bf`) | Free developer account at [devportal.jamendo.com](https://devportal.jamendo.com/) |
| **Audius Protocol** | No | Auto-discovery nodes | Open decentralized protocol, no API key needed |
| **Internet Archive** | No | Public API | Open access public domain catalog |
| **LRCLIB Lyrics** | No | Open REST API | Free open-source lyrics database at [lrclib.net](https://lrclib.net/) |
| **Spotify Web SDK** | Optional | Empty | Register an application on [developer.spotify.com](https://developer.spotify.com/) |
| **YouTube Embed** | Optional | IFrame No-Cookie Embed | No API key needed for standard embed player |

---

## ⚖️ Legal & Licensing Constraints

Wavelength adheres strictly to official developer terms and copyright laws:

1. **Jamendo Music**:
   - Audio is streamed strictly through official Jamendo content delivery URLs.
   - Tracks carry explicit Creative Commons metadata (`license_ccurl`) and are licensed for personal streaming.
2. **Audius Protocol**:
   - Streams are served via official Audius discovery nodes under the Audius Open Content terms.
3. **Internet Archive / Free Music Archive**:
   - Restricted to Public Domain Mark 1.0, Creative Commons 0 (CC0), and CC-BY recordings.
4. **Spotify Web Playback SDK**:
   - Streams full catalog only for authenticated Spotify Premium users using Spotify's official Web Playback SDK.
   - Uses OAuth PKCE; audio decryption happens strictly within Spotify's protected sandbox. No stream interception or downloading.
5. **YouTube Video Mode**:
   - Embeds the official YouTube IFrame Player API. No audio ripping, extraction, or DRM bypass.
6. **User Uploads**:
   - Enforces a mandatory non-negotiable legal rights declaration checkbox before any audio file is transcoded into the HLS pipeline.

---

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `Ctrl` + `Right` | Next Track |
| `Ctrl` + `Left` | Previous Track |
| `Right` / `Left` | Seek +5s / -5s |
| `Up` / `Down` | Volume +5% / -5% |
| `M` | Mute / Unmute |
| `L` | Like current track |
| `S` | Toggle Shuffle |
| `R` | Cycle Repeat (Off / All / One) |
| `Q` | Open / Close Play Queue |
| `V` | Toggle Official Video Mode |

---

## 🗺️ Future Implementation Roadmap

1. **Spotify Web Playback SDK OAuth PKCE Connect**:
   - Provide direct native Spotify account connection for Spotify Premium subscribers who wish to use Spotify's encrypted EME playback engine directly in addition to the open full-song engine.
2. **Collaborative Jam Sessions via WebSockets**:
   - Real-time shared listening rooms where friends can join a room, vote on upcoming tracks, and synchronize playback down to the millisecond.
3. **Smart AI Recommendations Engine**:
   - Item-item collaborative filtering paired with acoustic feature matching (danceability, tempo, acousticness) to generate dynamic personalized "Daily Mix" and "Discover Weekly" playlists.
4. **Offline Mobile Background Audio (Foreground Service)**:
   - Enhance Android Capacitor shell with Android foreground service notification controls for screen-locked playback of offline cached media.
5. **Lossless FLAC Local HLS Ingestion**:
   - Allow musicians and creators to drag-and-drop uncompressed audio with automated ffmpeg segmenting to 320kbps AAC and lossless Opus streams.

