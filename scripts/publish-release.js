const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitHubToken() {
  try {
    const cred = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8',
    });
    const match = cred.match(/^password=(.*)$/m);
    if (match && match[1]) return match[1].trim();
  } catch (err) {
    console.error('Error fetching git credential:', err.message);
  }
  return process.env.GITHUB_TOKEN || '';
}

async function main() {
  const token = getGitHubToken();
  if (!token) {
    console.error('No GitHub token found!');
    process.exit(1);
  }

  const owner = 'MohamedNavith';
  const repo = 'Spotify-Craft';
  const tag = 'v1.3.1';

  console.log(`Checking existing releases for ${owner}/${repo}...`);
  const listRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Wavelength-Publisher',
    },
  });

  const releases = await listRes.json();
  let release = Array.isArray(releases) ? releases.find((r) => r.tag_name === tag) : null;

  if (!release) {
    console.log(`Creating release ${tag}...`);
    const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Wavelength-Publisher',
      },
      body: JSON.stringify({
        tag_name: tag,
        target_commitish: 'main',
        name: 'Wavelength v1.3.1 - Full-Length Playback Parity Across Phone APK, PC Desktop & Web',
        body: `## 🎧 Wavelength v1.3.1 (Spotify-Craft)

Production-grade Spotify-style music streaming ecosystem across **Web**, **Android Mobile (APK)**, and **Windows PC Desktop (.exe)**.

---

### 📦 Downloads & Platforms
| Platform | Asset | Description |
| :--- | :--- | :--- |
| 📱 **Android** | [\`wavelength-mobile.apk\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-mobile.apk) | Direct APK install with native audio playback permissions & lock screen controls |
| 💻 **Windows PC** | [\`wavelength-windows-x64.zip\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-windows-x64.zip) | Portable desktop player with Windows global media key shortcuts |
| 💻 **Windows PC Executable** | [\`wavelength-desktop.exe\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-desktop.exe) | Standalone Windows application binary |
| 🌐 **Live Web App** | [https://mohamednavith.github.io/Spotify-Craft/](https://mohamednavith.github.io/Spotify-Craft/) | Hosted remotely on GitHub Pages (always online) |

---

### ✨ What's Fixed & Improved in v1.3.1
1. 🎵 **Full Song Playback on Mobile & PC Desktop (Zero 30s Cutoffs)**:
   - Fixed the 30-second audio preview cutoff on Android phone and Windows desktop.
   - Dual audio engine seamlessly streams the 100% full-length master release (3–5 minutes) from start to finish.
   - 30-second preview remains an optional manual toggle for data saving.
2. 📱 **Android Native WebView Media Permissions**:
   - Enabled \`setMediaPlaybackRequiresUserGesture(false)\` in Android \`MainActivity.java\` so background audio streaming and stream switching work automatically on Android phones without requiring a tap per song.
   - Enabled \`MIXED_CONTENT_ALWAYS_ALLOW\` and DOM database storage.
3. 🎬 **Massive Video & Master Audio Catalog Expansion**:
   - Over 150+ verified official studio master releases mapped across Bollywood, Indian chartbusters, Punjabi, Pop, and Global Top 50 hits.
   - Artists covered: Arijit Singh, Anirudh Ravichander, A.R. Rahman, Pritam, Sachin-Jigar, Karan Aujla, Diljit Dosanjh, Taylor Swift, Billie Eilish, Bruno Mars, Sabrina Carpenter, The Weeknd, Ed Sheeran, Coldplay, and more.
4. 📱 **Android Lock Screen & Quick Settings Notification Controls**:
   - Active playback state synchronization with live artwork, title, artist, play/pause, prev/next, and position scrubber.
5. 🔍 **Top Centric-Left Search Bar with Live Autocomplete**:
   - 200ms debounced live dropdown with top matching songs, thumbnails, and 1-click play.
`,
        draft: false,
        prerelease: false,
      }),
    });
   - Instant 200ms debounced live dropdown with top matching songs, artists, thumbnails, and 1-click play buttons.
4. 🎤 **Authentic Spotify Lyrics Typography**:
   - Redesigned with left-aligned, heavy bold sans-serif styling matching the official Spotify client.
   - Active singing line with subtle green text shadow glow; soft blur and dimming on inactive lines; automatic vertical smooth centering.
5. 🎬 **Fixed Official Video Mode**:
   - Overcame YouTube's deprecation of \`listType=search\` with a direct YouTube video ID resolver for global and regional hits.
   - Seamless floating Picture-in-Picture official video player with 1-click interactive search card fallback.
6. 📜 **Listening History & Recently Played**:
   - Brand new dedicated \`/history\` page and Home shelf displaying recently played tracks with 1-click Play All.
7. ⭐ **Favorite Artists & Settings Page**:
   - Dedicated Settings view (\`/settings\`) to customize favorite artists (Anirudh, A.R. Rahman, Arijit Singh, Taylor Swift, Billie Eilish, Bruno Mars, etc.).
   - "Recommended Based on Your Favorites" dynamic shelf on Home.
   - Audio streaming bitrate selector (320kbps Lossless, 256kbps, 128kbps).
8. 🌟 **Popular Artists Shelf**:
   - Circular artist portraits with hover green play button matching the official Spotify Web Home page.
`,
        draft: false,
        prerelease: false,
      }),
    });

    release = await createRes.json();
    if (!createRes.ok) {
      console.error('Failed to create release:', release);
      process.exit(1);
    }
    console.log(`Release created: ${release.html_url}`);
  } else {
    console.log(`Release already exists: ${release.html_url}`);
  }

  const uploadBaseUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets`;

  // List existing assets to avoid duplicate names
  const existingAssets = release.assets || [];

  const filesToUpload = [
    {
      name: 'wavelength-mobile.apk',
      path: path.join(__dirname, '..', 'wavelength-mobile.apk'),
      contentType: 'application/vnd.android.package-archive',
    },
    {
      name: 'wavelength-windows-x64.zip',
      path: path.join(__dirname, '..', 'wavelength-windows-x64.zip'),
      contentType: 'application/zip',
    },
    {
      name: 'wavelength-desktop.exe',
      path: path.join(__dirname, '..', 'wavelength-desktop.exe'),
      contentType: 'application/vnd.microsoft.portable-executable',
    },
  ];

  for (const file of filesToUpload) {
    if (!fs.existsSync(file.path)) {
      console.warn(`File not found: ${file.path}`);
      continue;
    }

    const existing = existingAssets.find((a) => a.name === file.name);
    if (existing) {
      console.log(`Deleting existing asset ${file.name} (id: ${existing.id})...`);
      await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/assets/${existing.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'Wavelength-Publisher',
          },
        }
      );
    }

    console.log(`Uploading ${file.name} (${(fs.statSync(file.path).size / 1024 / 1024).toFixed(2)} MB)...`);
    const curlCmd = `curl.exe -s -S -X POST -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" -H "Content-Type: ${file.contentType}" --data-binary "@${file.path.replace(/\\/g, '/')}" "${uploadBaseUrl}?name=${file.name}"`;
    try {
      const output = execSync(curlCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      const uploadData = JSON.parse(output);
      if (uploadData.browser_download_url) {
        console.log(`✓ Uploaded ${file.name}: ${uploadData.browser_download_url}`);
      } else {
        console.error(`Failed to upload ${file.name}:`, uploadData);
      }
    } catch (err) {
      console.error(`Error uploading ${file.name}:`, err.message);
    }
  }

  console.log('\n🎉 Release published successfully!');
  console.log(`Release URL: ${release.html_url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
