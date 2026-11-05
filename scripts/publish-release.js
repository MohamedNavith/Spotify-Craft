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
  const tag = 'v1.6.2';

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
        name: 'Wavelength v1.6.2 - Spicetify Cinematic Fluid Lyrics, Kinetic Pop Screensaver & Zigzag Constellations',
        body: `## 🌌 Wavelength v1.6.2 (Spicetify & Kinetic Screensaver Edition)

Major visual release inspired by community reels, featuring the **Spicetify Beautiful Lyrics Cinematic Mode**, the **Mac Screensaver Kinetic Pop & Badges Mode**, and the **Zigzag Constellation Star Engine**.

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

### ✨ What's New in v1.6.2

#### 1. 🌸 Spicetify Cinematic Fluid Lyrics Mode (\`Spicefy Reel.mp4\`)
- **Split-Screen Studio Layout**: Left side features floating Album Artwork card, track details, interactive timeline scrubber, and elapsed/remaining timestamps.
- **Chromatic Fluid Nebula Glow**: An animated multi-colored gradient aurora blob (cyan, magenta, violet) smoothly tracks and pulses directly behind the active singing line.
- **Apple Music-Style Blurred Text**: Inactive lines are dimmed and softly blurred (\`blur-[0.6px] opacity-35\`), smoothly scrolling into view as the song progresses.
- **Click-to-Seek**: Tap any lyric line to jump playback directly to that second.

#### 2. ⚡ Kinetic Pop & Badges Screensaver Mode (\`reel2.mp4\`)
- **Live Lockscreen Clock & Date**: Clean minimalist clock (\`12:39\` / \`Sun, Oct 25\`) at top.
- **Dynamic Typographic Blocks**: Stacks lyrics with varied fonts (*italic serif*, **extra bold sans**, solid accent badges).
- **Amber Highlight Badges & Emojis**: Key words pop inside solid golden amber badges (\`[ yeah, ]\`, \`[ girl ]\`) accompanied by glowing emojis and icons (\`🧡\`, \`✦\`, \`🔊\`, \`👼\`).
- **OLED Dark Space & Lumn Rim Glow**: Pure black background framed by the ambient display rim lighting.

#### 3. 🌟 Zigzag Celestial Constellation Fix
- Fixed the previous straight-line drift in procedural placement.
- Stars now alternate turns sharply ($80^\\circ$ to $160^\\circ$) across screen quadrants, creating a true celestial zigzag star map with glowing diamond markers (\`✦\`) and animated connecting constellation lines.
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
