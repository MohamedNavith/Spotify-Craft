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
  const tag = 'v1.6.1';

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
        name: 'Wavelength v1.6.1 - Constellation Procedural Star Map, Pure OLED Space & Mobile Exit Controls',
        body: `## 🌌 Wavelength v1.6.1 (Constellation Evolution)

This release implements major requested visual and interactive upgrades to the **Verci Constellation Engine**, inspired by modern open-source audio architectures like **OpenTune**, while polishing mobile controls.

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

### ✨ What's New in v1.6.1

#### 1. 🌟 Procedural Randomized Constellation Star Placements
- Words no longer spawn in the same static 9-point coordinates.
- Each lyric line's layout is procedurally seeded by the line's text and timestamp.
- The initial word can anchor in any quadrant (top-right, bottom-left, center, top-left, bottom-right, etc.), branching organically across the canvas along curved celestial paths with collision avoidance to prevent word overlap.

#### 2. 📱 Guaranteed Mobile Exit & Touch Gestures
- **Floating Safe-Area Exit Pill**: Added a high-contrast floating Exit pill at top-right with \`env(safe-area-inset-top)\` spacing to prevent interference from camera notches or camera cutouts.
- **Bottom HUD Exit Button**: Direct thumb-reachable "Exit" button in the bottom playback control bar.
- **Swipe-Down Dismiss**: Natural vertical swipe-down gesture anywhere on the screen cleanly dismisses Constellation mode.

#### 3. 🌑 Pure Pitch-Black OLED Space
- Completely eliminated the background dotted \`+\` grid pattern (\`bg-[radial-gradient(...)]\`).
- Pure true-black \`#000000\` background lets OLED and AMOLED screens turn pixels completely off, highlighted only by subtle nebula color blooms and Lumn ambient display perimeter rim glow.

#### 4. 💎 Liquid Frosted Glass Specular Contours
- Subtle top specular edge highlight (\`inset 0 1px 0 0 rgba(255, 255, 255, 0.18)\`) applied to floating headers and bars for depth and realism.
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
