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
  const tag = 'v1.5.1';

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
        name: 'Wavelength v1.5.1 - 100% Ad-Free 320kbps Master Studio Audio Engine & Complete Ecosystem',
        body: `## 🎧 Wavelength v1.5.1 (Spotify-Craft)

Production-grade Spotify-style music streaming ecosystem across **Web**, **Android Mobile (APK)**, and **Windows PC Desktop (.exe)**.

---

### 📦 Downloads & Platforms
| Platform | Asset | Description |
| :--- | :--- | :--- |
| 📱 **Android** | [\`wavelength-mobile.apk\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-mobile.apk) | Direct APK install with native audio playback permissions, gesture controls, lock screen controls & 100% Ad-Free 320kbps Master Engine |
| 💻 **Windows PC** | [\`wavelength-windows-x64.zip\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-windows-x64.zip) | Portable desktop player with Windows global media key shortcuts & Ad-Free network filtering |
| 💻 **Windows PC Executable** | [\`wavelength-desktop.exe\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-desktop.exe) | Standalone Windows application binary |
| 🌐 **Live Web App** | [https://mohamednavith.github.io/Spotify-Craft/](https://mohamednavith.github.io/Spotify-Craft/) | Hosted remotely on GitHub Pages (always online) |

---

### ✨ What's New in v1.5.1 (Zero-Ad Master Audio Parity Release)
1. 🚫 **Permanently Eliminated Commercial Video Ads**:
   - Replaced hidden background YouTube player with direct 320kbps master studio audio CDN stream (\`https://aac.saavncdn.com/..._320.mp4\`).
   - Zero YouTube pre-roll ads, zero audio watermarks, zero commercial interruptions.
   - YouTube video iframe is strictly mounted ONLY when the user explicitly taps "Watch Video".
2. 🎵 **Full Master Studio 320kbps Lossless Audio Quality**:
   - Original audio tracks by the true composer and artist.
   - Native byte-range seeking for instantaneous scrubbing with zero lag.
3. ⏭️ **Guaranteed Auto-Next Track Playback**:
   - Seamless transition to the next queued track when the current song completes.
4. 🌙 **Interactive Sleep Timer**:
   - Flexible timer presets (5m, 10m, 15m, 30m, 45m, 1h, End of track) with automatic fade and pause.
5. 🏝️ **Translucent Dynamic Island**:
   - Non-intrusive translucent glass pill that expands smoothly into full player controls upon touch.
6. 📸 **Spotify-Style Visual Photo Card Sharing**:
   - Generates high-res 9:16 story cards with album cover, wave barcode, and deep link for Snapchat, Instagram, and WhatsApp.
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
