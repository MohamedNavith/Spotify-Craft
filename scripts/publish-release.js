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
      return await fetch(url, options);
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
  const tag = 'v2.1.1';
  const apkPath = path.join(
    __dirname,
    '..',
    'mobile_flutter',
    'build',
    'app',
    'outputs',
    'flutter-apk',
    'app-release.apk'
  );
  if (!fs.existsSync(apkPath)) {
    console.error(`APK not found: ${apkPath}`);
    process.exit(1);
  }
  const apkMb = (fs.statSync(apkPath).size / 1024 / 1024).toFixed(2);
  const releaseTitle =
    'Wavelength v2.1.1 — Dedicated Android App Using Flutter (Not WebView)';
  const releaseBody = `## Wavelength v2.1.1 — Dedicated Native Android App (Flutter, Not WebView)

Built natively with **Flutter & Kotlin/Media3 (ExoPlayer)** — completely replacing the old WebView wrapper while running **100% free of cost (\$0 server hosting)** via direct stream resolution and local SQLite persistence.

---

### Download

| Platform | Asset | Size | Download |
| :--- | :--- | :--- | :--- |
| **Android (Native Flutter, API 24+)** | \`wavelength-android-flutter.apk\` | ${apkMb} MB | [Download APK](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-android-flutter.apk) |

*(Previous releases remain archived under [Releases](https://github.com/${owner}/${repo}/releases).)*

---

### What's New in v2.1.1 (Full Visual & Feature Parity)
- **Floating Dynamic Island**: Under-camera pill with spinning album art, live animated equalizer bars, expandable player capsule (scrubber, Like, Prev / Play-Pause / Next, Verci orb), and swipe-up dismiss / top-bar toggle.
- **Verci & Lumn Studio (6 Interactive Modes + Ambient Rim Glow)**: FNV-1a zigzag **Constellation** star-map with synced LRCLIB lyrics, **25s Video Canvas**, **Spicetify Studio**, **Kinetic Pop** lockscreen clock + bold typography pills, **Fisheye**, **Minimalist HUD**, font family selector, text-scale slider, and Lumn rim-glow intensity control.
- **Hi-Res Streaming Quality Modal & Audio Engine**: Apple-style dark **Mobile Data Streaming** sheet (\`Low\`, \`High Efficiency HE-AAC\`, \`High Quality 256kbps\`, \`Lossless 24-bit/48kHz\`, \`Hi-Res Lossless 24-bit/192kHz\`) with high-data warning prompts, hardware 5-band Equalizer + Crossfade (\`0–12s\`), and real-time USB-C DAC & Bluetooth codec readout.
- **Exact Wavelength Home, Search, Library & Clean Consumer Settings**: \`All | Music | Podcasts\` filter chips, Personalized Favorite Singers shelf & multi-select picker in Settings, Damerau-Levenshtein typo-tolerant & lyric search, Create Playlist green banner with live song picker, Spotify / Exportify CSV/JSON importer, 9:14 Share Photo Card studio (4 preset themes, \`Song | Lyrics\` toggle, QR, 15s MP4 clip), and clean consumer-only playback settings (no Meta/Snap/developer IDs).
- **Rich Lock Screen, Headset Controls & Strict LIFO Back Stack**: \`MediaStyle\` foreground service, **1x / 2x / 3x** wired & Bluetooth button clicks, Home Widget, Quick Settings Tile, Android Auto browse tree, and strict LIFO unwinding (\`keyboard → modal → Verci → Dynamic Island → Full Player → nested tab → Home → double-back exit toast\`).
`;

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
        name: releaseTitle,
        body: releaseBody,
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
    console.log(`Updating existing release ${tag}...`);
    const patchRes = await fetchWithRetry(
      `https://api.github.com/repos/${owner}/${repo}/releases/${release.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Wavelength-Publisher',
        },
        body: JSON.stringify({
          name: releaseTitle,
          body: releaseBody,
          draft: false,
          prerelease: false,
        }),
      }
    );
    release = await patchRes.json();
    console.log(`Release ready: ${release.html_url}`);
  }

  const uploadBaseUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets`;
  const existingAssets = release.assets || [];

  const filesToUpload = [
    {
      name: 'wavelength-android-flutter.apk',
      path: apkPath,
      contentType: 'application/vnd.android.package-archive',
    },
  ];

  for (const file of filesToUpload) {
    if (!fs.existsSync(file.path)) {
      console.error(`File not found: ${file.path}`);
      process.exit(1);
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

    const mb = (fs.statSync(file.path).size / 1024 / 1024).toFixed(2);
    console.log(`Uploading ${file.name} (${mb} MB)...`);
    const curlCmd = `curl.exe -s -S -X POST -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" -H "Content-Type: ${file.contentType}" --data-binary "@${file.path.replace(/\\/g, '/')}" "${uploadBaseUrl}?name=${file.name}"`;
    const output = execSync(curlCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const uploadData = JSON.parse(output);
    if (uploadData.browser_download_url) {
      console.log(`UPLOADED ${file.name}: ${uploadData.browser_download_url}`);
    } else {
      console.error(`Failed to upload ${file.name}:`, uploadData);
      process.exit(1);
    }
  }

  console.log(`RELEASE_URL=${release.html_url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
