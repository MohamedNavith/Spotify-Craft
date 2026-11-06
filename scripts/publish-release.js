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
  const tag = 'v1.6.3';

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
        name: 'Wavelength v1.6.3 - 25s Highlight Video Canvas, Dedicated Under-Camera Dynamic Island & Studio Polish',
        body: `## 🎬 Wavelength v1.6.3 (Video Canvas & Dynamic Island Edition)

Major visual and interaction overhaul inspired by community reels (\`Spotify gif Lyrics.mp4\`), featuring the **25-Second Highlight Video Canvas Engine**, the **Dedicated Under-Camera Notch Dynamic Island**, and clean mobile/desktop edge alignment.

---

### 📦 Downloads & Platforms
| Platform | Asset | Description |
| :--- | :--- | :--- |
| 📱 **Android Mobile** | [\`wavelength-mobile.apk\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-mobile.apk) | Native Spotify Mobile experience: Bottom navigation bar, floating mini-player, full-screen swipe sheet, offline-first local bundling & safe area insets |
| 💻 **Windows PC Standalone** | [\`wavelength-desktop.exe\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-desktop.exe) | Single portable executable with media keys, ad-blocking, and Lumn border glow |
| 💻 **Windows PC Portable Zip** | [\`wavelength-windows-x64.zip\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-windows-x64.zip) | Portable folder distribution for Windows x64 |
| 🤖 **Discord Music Bot** | [\`wavelength-bot-wispbyte.zip\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-bot-wispbyte.zip) | Wispbyte/Pterodactyl container-ready bot package (Node 22, DAVE encryption, 320kbps streams) |
| 🌐 **Live Web Player** | [https://mohamednavith.github.io/Spotify-Craft/](https://mohamednavith.github.io/Spotify-Craft/) | Hosted remotely on GitHub Pages with instant PWA capabilities |

---

### ✨ What's New in v1.6.3

#### 1. 🎬 20-30s Highlight Music Video Canvas (\`Spotify gif Lyrics.mp4\`)
- **Seamless Climax Loops**: Curated and procedural engine that automatically loops the best 20-30 seconds (chorus, hook, iconic drop) of official music videos and animated waveform canvases (e.g. *Die With A Smile*, *I Wanna Be Yours*, *Tum Hi Ho*, *Blinding Lights*, *Starboy*, *Kesariya*, *Hukum*, etc.).
- **Split-Screen Studio Mode**: Left side showcases the looping 25s video canvas card with floating specular aura, timeline scrubber, and elapsed/remaining timestamps, while the right side displays full synchronized kinetic lyrics with Apple Music-style blur on inactive lines.
- **Normal Playable Mode**: The 25s highlight video canvas is directly playable in normal playback mode — right inside the **Mobile Fullscreen Now Playing Card** and the **Desktop Now Playing Right Drawer**, with instant \`[ 🎬 Canvas / 🎵 Art ]\` toggling.

#### 2. 🏝️ Dedicated Under-Camera Notch Dynamic Island
- **Camera Cutout Docking**: Positioned directly beneath the front camera punch hole / notch (\`top: max(env(safe-area-inset-top), 8px)\`, centered horizontally).
- **Auto-Pop & Settle Animation**: Pops down smoothly from the camera notch whenever track changes or playback toggles, displaying spinning artwork, equalizer bars, and song title.
- **Swipe-to-Dismiss & Clean Screen**: Swipe up on the island or tap the direct \`✕\` button to dismiss/hide the island anytime for a 100% clean, distraction-free screen.
- **Instant Restore**: Sleek Dynamic Island toggle pill in the Top Bar and Settings page allows showing or hiding the island anytime with 1 tap.
- **Cosmic Immunity**: Dynamic Island automatically hides in Verci / Fullscreen visualizer modes to prevent any visual clutter.

#### 3. 🎯 Verci Exit Bug & Alignment Fix
- **Eliminated Duplicate Buttons**: Removed the redundant floating \`sm:hidden\` exit button and bottom HUD duplicate exit button.
- **Unified Frosted Glass Exit Pill**: Placed a single, prominent frosted glass pill button in the top header, perfectly aligned and notch-immune.
- **No More Overlays**: Top header controls (Style Selector, Fullscreen, Exit) never overlap or hide beneath other buttons on any phone or desktop screen.

#### 4. 📱 Edge-to-Edge Safe Area Immersion
- Proper \`env(safe-area-inset-top)\` and \`env(safe-area-inset-bottom)\` padding across headers, drawer panels, and navigation bars, preventing collisions with Android camera cutouts and system gesture bars.
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
