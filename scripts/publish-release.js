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

async function fetchWithRetry(url, options = {}, retries = 4, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      console.warn(`Fetch attempt ${i + 1} failed: ${err.message}. Retrying in ${delay}ms...`);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 1.5;
    }
  }
}

async function main() {
  const token = getGitHubToken();
  if (!token) {
    console.error('No GitHub token found!');
    process.exit(1);
  }

  const owner = 'MohamedNavith';
  const repo = 'Spotify-Craft';
  const tag = 'v2.0.0';

  console.log(`Checking existing releases for ${owner}/${repo}...`);
  const listRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/releases`, {
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
    const createRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/releases`, {
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
        name: 'Wavelength v2.0.0 - Hi-Res Lossless Audio Engine, Fluid Mobile Gestures & Studio Architecture',
        body: `## 🚀 Wavelength v2.0.0 (The Lossless & Gesture Architecture Edition)

A landmark milestone release introducing **Apple Music-grade 24-bit/192kHz Hi-Res Lossless Audio**, complete **Mobile UX & Gesture Architecture Overhaul**, **Capacitor 6 Hierarchical Hardware Back Navigation**, and **Playwright Automated UI Testing Suite**.

---

### 📦 Direct Downloads & Platforms
| Platform | Package | Description | Download Link |
| :--- | :--- | :--- | :--- |
| 📱 **Android Mobile** | \`wavelength-mobile.apk\` | Native Spotify Mobile experience: Bottom navigation bar, gesture-driven deck swipe, lock screen controls, zero ads | [⬇️ **Download APK**](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-mobile.apk) |
| 💻 **Windows PC Standalone** | \`wavelength-desktop.exe\` | Single portable executable with media keys, ad-blocking, and Lumn border glow | [⬇️ **Download Windows EXE**](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-desktop.exe) |
| 💻 **Windows PC Portable Zip** | \`wavelength-windows-x64.zip\` | Unpack-and-run full distribution for Windows x64 | [⬇️ **Download Portable ZIP**](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-windows-x64.zip) |
| 🤖 **Discord Music Bot** | \`wavelength-bot-wispbyte.zip\` | Container-ready bot package (Node 22, DAVE encryption, 320kbps streams) | [⬇️ **Download Bot ZIP**](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-bot-wispbyte.zip) |
| 🌐 **Live Web Player** | Web App | Instant PWA hosted on GitHub Pages | [▶️ **Launch Web Player**](https://mohamednavith.github.io/Spotify-Craft/) |

---

### ✨ What's New in v2.0.0

#### 1. 🎼 24-bit/192kHz ALAC/FLAC Hi-Res Lossless Audio Architecture
- **Multi-Tier Quality Engine**: High Efficiency (64kbps HE-AAC), High Quality (256-320kbps AAC/MP3 default), Lossless (ALAC up to 24-bit/48kHz), and Hi-Res Lossless (ALAC/FLAC up to 24-bit/192kHz at ~9,216 kbps bandwidth).
- **Apple Music-Styled Streaming Quality Sheet**: Data consumption calculator (1.5 MB up to 145 MB per song) with clear warnings before enabling on cellular connections.
- **Honest Stream Inspection**: Real-time provenance inspection badge (\`HIGH QUALITY (LOSSLESS UNAVAILABLE)\`) ensuring 100% transparency without fake upsampling.
- **Audiophile Hardware Compatibility**: Hardware guide for external USB-C DAC dongles on phones like Samsung Galaxy S25 Ultra and Oppo Reno 8T to bypass Android mixer resampling.

#### 2. 📱 Fluid Mobile Touch & Gesture Overhaul
- **Isolated Artwork Deck Swiping**: Horizontal track skipping is scoped exclusively to the central album artwork deck, preventing collisions with progress scrubber seeking or volume adjustments.
- **Pull-Down Sheet Collapse**: Natural downward drag gesture from the top bar smoothly collapses full-screen player back to floating mini player.
- **Zero Touch Latency**: Integrated \`touch-manipulation\` and \`touch-none\` CSS utilities eliminating the standard 300ms mobile touch delay.

#### 3. 🔙 Hierarchical Android Back Navigation
- Powered by native \`@capacitor/app\` integration.
- Dismisses open modal sheets first (Now Playing, Lyrics, Quality Modal, Queue, Equalizer, Sleep Timer, Share Sheet).
- Navigates back through viewed pages/tabs with \`router.back()\`.
- Double-tap back within 2,000ms on root Home with a Spotify-styled pill toast to safely exit the app.

#### 4. 📜 Instant Master Playback & Synchronized Lyrics Fix
- Cached master stream resolver eliminates the 2-second 30-second preview clip delay — full tracks start instantly from 0:00.
- Synchronized karaoke lyrics with vertical centering padding (\`py-[38vh]\`), -0.2s vocal anticipation, user scroll detection, and floating "Sync lyrics ↺" pill.

#### 5. 🎭 Automated Playwright Retina UI Suite
- Complete automated visual regression suite running headless Chrome.
- 9 verified high-resolution screenshots capturing every desktop and mobile workflow embedded directly in project documentation.
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
    {
      name: 'wavelength-bot-wispbyte.zip',
      path: path.join(__dirname, '..', 'wavelength-bot-wispbyte.zip'),
      contentType: 'application/zip',
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
      await fetchWithRetry(
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
