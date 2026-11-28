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
  const tag = 'v2.1.0';
  const releaseTitle =
    'Wavelength v2.1.0 — Dedicated Android App Using Flutter (Not WebView)';
  const releaseBody = `## Wavelength v2.1.0 — Dedicated Native Android App (Flutter, Not WebView)

This release introduces the **dedicated Android app built natively with Flutter & Kotlin/Media3 (ExoPlayer)** — completely replacing the old Capacitor WebView wrapper while running **100% free of cost ($0 server hosting)** via direct stream resolution and local SQLite persistence.

---

### Download

| Platform | Asset | Size | Download |
| :--- | :--- | :--- | :--- |
| **Android (Native Flutter, API 24+)** | \`wavelength-android-flutter.apk\` | 56.1 MB | [Download APK](https://github.com/${owner}/${repo}/releases/download/${tag}/wavelength-android-flutter.apk) |

*(Windows Desktop \`.exe\`, Portable ZIP, and Discord Bot ZIP remain available under [Release v2.0.0](https://github.com/${owner}/${repo}/releases/tag/v2.0.0).)*

---

### Highlights (Native Flutter App — Zero WebView)
- **Dedicated Native Engine**: Built on **Flutter** + **Android ExoPlayer (\`just_audio\` / \`audio_service\`)**, preserving Hi-Res FLAC / 320k AAC stream quality directly on-device with zero browser/WebView overhead.
- **Rich Lock Screen, Notification Shade & Headset Controls**: \`MediaStyle\` foreground service with cached album artwork, seekbar progress, **Prev / Play-Pause / Next / Heart Like / Stop** actions, **1x / 2x / 3x** wired & Bluetooth earphone button support, \`AudioFocus\` call/navigation handling, and instant auto-pause on headphone unplug or Bluetooth disconnect.
- **Strict LIFO Hardware Back Navigation**: Nested per-tab navigation stacks (Home / Search / Library), preserved scroll positions, modal/keyboard dismissal first, collapsible Full Player keeping the Mini-Player visible, and double-back exit confirmation only at root Home.
- **Typo-Tolerant Fuzzy & Lyric Search**: Damerau-Levenshtein + phonetic search, \`"Did you mean..."\`, filter chips (\`All\`, \`Songs\`, \`Artists\`, \`Albums\`, \`Playlists\`, \`Lyrics\`), and synced karaoke LRCLIB lyrics with tap-to-seek.
- **Playlists, Offline Downloads, EQ, USB DAC & Widgets**: Local SQLite persistence, multi-select Add-to-Playlist with Undo, drag reorder, 5-band hardware Equalizer + Bass Boost + LoudnessEnhancer, USB-C DAC & Bluetooth sample-rate readout, Home Screen Widget, Quick Settings Tile, and Android Auto browse tree.
- **Story Sharing & Spotify Importer**: 9:16 & 1:1 story card renderer, 15s animated waveform MP4 clip exporter, QR/JSON playlist sharing, and Spotify link / Exportify CSV/JSON importer.
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
