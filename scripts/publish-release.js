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
  const tag = 'v1.5.0';

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
        name: 'Wavelength v1.5.0 - Ad-Free Master Engine, Auto-Next, Sleep Timer & Photo Card Sharing',
        body: `## 🎧 Wavelength v1.5.0 (Spotify-Craft)

Production-grade Spotify-style music streaming ecosystem across **Web**, **Android Mobile (APK)**, and **Windows PC Desktop (.exe)**.

---

### 📦 Downloads & Platforms
| Platform | Asset | Description |
| :--- | :--- | :--- |
| 📱 **Android** | [\`wavelength-mobile.apk\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-mobile.apk) | Direct APK install with native audio playback permissions, gesture controls, lock screen controls & Ad-Free Media Engine |
| 💻 **Windows PC** | [\`wavelength-windows-x64.zip\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-windows-x64.zip) | Portable desktop player with Windows global media key shortcuts & Ad-Free network filtering |
| 💻 **Windows PC Executable** | [\`wavelength-desktop.exe\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-desktop.exe) | Standalone Windows application binary |
| 🌐 **Live Web App** | [https://mohamednavith.github.io/Spotify-Craft/](https://mohamednavith.github.io/Spotify-Craft/) | Hosted remotely on GitHub Pages (always online) |

---

### ✨ What's New in v1.5.0 (Ad-Free & Music Quality Parity Release)
1. 🚫 **Ad-Free Media Engine Across All Platforms**:
   - Zero YouTube video commercial ads!
   - Built-in Android WebView request interceptor in \`MainActivity.java\` blocks advertising networks before they download.
   - Electron Desktop network filter in \`desktop/main.js\` eliminates commercial ad traffic.
   - Dynamic real-time ad silencer and fast-forward skipper in web playback engine.
2. ⏭️ **Guaranteed Auto-Next Track Playback**:
   - Continuous uninterrupted playback: when a track reaches its conclusion, it smoothly transitions to the next queued song automatically.
3. 🎯 **Strict Studio Composer Resolver (Zero Mismatches)**:
   - Eliminated substring collision bug where short words matched unrelated songs. Strict word-boundary matching guarantees the exact original studio track by the composer.
4. 🌙 **Interactive Sleep Timer**:
   - Real interactive modal sheet with options: 5m, 10m, 15m, 30m, 45m, 1 hour, and "End of this track".
   - Live countdown display with automatic pause when the timer expires.
5. 🏝️ **Translucent Dynamic Island**:
   - Sleek semi-transparent glass pill (\`bg-black/40 backdrop-blur-2xl\`) that stays subtle and unobtrusive, popping up into the full interactive player only when tapped. Active on both phone and website!
6. 📸 **Spotify-Style Visual Photo Card Sharing**:
   - Generates high-resolution 9:16 story cards with album artwork, title, composer, sound wave barcode, and deep link for Snapchat, Instagram Stories, and WhatsApp.
   - Includes direct "Save Photo to Gallery" download button.
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
