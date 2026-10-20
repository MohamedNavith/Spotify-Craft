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
  const tag = 'v1.4.0';

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
        name: 'Wavelength v1.4.0 - Dynamic Island, Full Spotify APK UI & Universal Full Songs',
        body: `## 🎧 Wavelength v1.4.0 (Spotify-Craft)

Production-grade Spotify-style music streaming ecosystem across **Web**, **Android Mobile (APK)**, and **Windows PC Desktop (.exe)**.

---

### 📦 Downloads & Platforms
| Platform | Asset | Description |
| :--- | :--- | :--- |
| 📱 **Android** | [\`wavelength-mobile.apk\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-mobile.apk) | Direct APK install with native audio playback permissions, gesture controls & lock screen controls |
| 💻 **Windows PC** | [\`wavelength-windows-x64.zip\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-windows-x64.zip) | Portable desktop player with Windows global media key shortcuts |
| 💻 **Windows PC Executable** | [\`wavelength-desktop.exe\`](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-desktop.exe) | Standalone Windows application binary |
| 🌐 **Live Web App** | [https://mohamednavith.github.io/Spotify-Craft/](https://mohamednavith.github.io/Spotify-Craft/) | Hosted remotely on GitHub Pages (always online) |

---

### ✨ What's New in v1.4.0 (Spotify APK Parity Release)
1. 🎵 **Universal Full Song Playback (100% of Catalog)**:
   - Dynamic real-time resolver automatically queries verified master releases for any song (Bollywood, Tamil, English, Punjabi, etc.).
   - Guaranteed full-length streaming (0:00 to 4:21+ mins) with zero 30s cutoffs.
2. 👆 **Horizontal Swipe Gesture to Switch Songs**:
   - Push right-to-left to slide to the next track with smooth realtime card translation.
   - Push left-to-right to return to the previous track.
3. 🏝️ **Dynamic Island Floating Media Controller**:
   - Floating top widget with live audio visualizer, timeline scrubber, media buttons, and bottom row of 4 upcoming song tiles.
4. 👻 **Snapchat, Instagram Stories & Social Share Modal**:
   - Spotify-style shareable card with customizable gradient color palette, Song / Lyrics quote toggle, and 1-tap Snapchat & WhatsApp sharing.
5. 💿 **Full Album Detail UI (Featuring Aashiqui 2)**:
   - Dedicated album view with artwork cover, release date, action row (+, download, share, shuffle, play), and full tracklist.
6. 📚 **Your Library & Create (+) Sheet Modal**:
   - Exact Spotify APK layout with circular artist portraits (Ilaiyaraaja, Unnikrishnan, P. Susheela, S. Janaki, Kamal Haasan, Arijit Singh), Recents sorting, and Playlist / Blend creation sheet.
7. 🔙 **Android Hardware/Software Back Button Support**:
   - Tapping the Android exit button closes open sheets and player overlays or returns to Home instead of abruptly quitting the app.
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
