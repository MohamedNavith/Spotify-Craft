const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const root = new URL(process.env.WAVELENGTH_URL || 'http://localhost:3001/');

async function verifyLibrary(page) {
  const main = page.locator('main');
  await page.goto(new URL('search/', root).href);
  await page.getByRole('textbox', { name: 'Search the catalog' }).fill('chi');
  await main
    .getByRole('link', { name: /Chill Waves/ })
    .first()
    .click();
  await main.getByRole('button', { name: 'Save a copy to library' }).click();
  await page.getByLabel('Add songs').fill('die');
  await main
    .getByRole('button', { name: /Die With A Smile ·/ })
    .first()
    .click();
  await main.getByRole('button', { name: 'Play Die With A Smile', exact: true }).waitFor();
  await page.reload();
  await main.getByRole('button', { name: 'Remove Die With A Smile', exact: true }).click();
  await main
    .getByRole('button', { name: 'Play Die With A Smile', exact: true })
    .waitFor({ state: 'detached' });

  await page.getByTitle('Create playlist or blend').click();
  const editor = page.getByRole('dialog', { name: 'Add to Your Library' });
  await editor.getByLabel('Playlist Title').fill('Night Drive');
  await editor.getByLabel('Search songs to add to playlist').fill('die');
  await editor.getByRole('button', { name: 'Add', exact: true }).first().click();
  await editor.getByRole('button', { name: /Save Playlist to Library/ }).click();
  await main.getByRole('heading', { name: 'Night Drive' }).waitFor();
  await page.keyboard.press('/');
  const headerSearch = page.getByRole('textbox', { name: 'Search music' });
  assert(await headerSearch.evaluate((input) => document.activeElement === input));
  await headerSearch.fill('nig');
  await page
    .locator('header')
    .getByRole('link', { name: /Night Drive/ })
    .waitFor();
  await headerSearch.press('Enter');
  await main.getByRole('button', { name: 'Playlists', exact: true }).click();
  await main.getByRole('link', { name: /Night Drive/ }).waitFor();
}

async function verifyImport(page) {
  const archive = {
    playlists: [
      {
        name: 'Evening',
        items: [{ track: { trackName: 'Die With A Smile', artistName: 'Lady Gaga & Bruno Mars' } }],
      },
      {
        name: 'Morning Drive',
        items: [{ track: { trackName: 'Tum Hi Ho', artistName: 'Arijit Singh' } }],
      },
    ],
  };
  await page.getByTitle('Sync & Import Spotify Playlists').click();
  await page.locator('input[type=file][accept*="csv"]').setInputFiles({
    name: 'Playlists1.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(archive)),
  });
  await page.getByLabel('Playlist in this file').selectOption('1');
  await page.getByText('Morning Drive (1 song)').waitFor();
  await page.getByRole('button', { name: 'Add to Library', exact: true }).click();
  await page.getByRole('button', { name: 'Close import' }).click();
  await page.reload();
  await page
    .getByRole('complementary', { name: 'Your library' })
    .getByText('Morning Drive', { exact: true })
    .click();
  await page.locator('main').getByRole('button', { name: 'Play Tum Hi Ho', exact: true }).waitFor();
}

// An ordinary PCM file lets the browser exercise media and IndexedDB without network access.
function silentWav() {
  const bytes = Buffer.alloc(44 + 16000 * 12);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(8000, 24);
  bytes.writeUInt32LE(16000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(bytes.length - 44, 40);
  return bytes;
}

async function verifyQueueAndOfflinePlayback(page) {
  let offline = false;
  const sample = silentWav();
  await page.route('**/playlist-test-*.wav', (route) =>
    offline
      ? route.abort()
      : route.fulfill({ status: 200, contentType: 'audio/wav', body: sample }),
  );
  const tracks = [1, 2].map((i) => ({
    id: 'jamendo:test-' + i,
    provider: 'jamendo',
    providerTrackId: 'test-' + i,
    title: 'Test audio ' + i,
    artistName: 'Test artist',
    duration: 12,
    streamUrl: new URL('playlist-test-' + i + '.wav', root).href,
    streamFormat: 'wav',
    license: 'Test recording',
    explicit: false,
    audioDownloadAllowed: true,
  }));
  await page.evaluate((tracks) => {
    const library = JSON.parse(localStorage.getItem('wavelength_user_playlists') || '[]');
    library.push({ id: 'test-media', title: 'Media test', tracks, createdAt: 0 });
    localStorage.setItem('wavelength_user_playlists', JSON.stringify(library));
  }, tracks);
  await page.goto(new URL('playlist/?id=test-media', root).href);
  const main = page.locator('main');
  await main.getByRole('button', { name: 'Play playlist', exact: true }).click();
  const playing = () =>
    page.waitForFunction(() => document.querySelector('audio')?.currentTime > 0.1);
  await playing();
  await page.getByTitle('Next (Ctrl+Right)').click();
  await main.getByRole('button', { name: 'Pause Test audio 2', exact: true }).waitFor();
  await page.waitForFunction(() =>
    document.querySelector('audio')?.currentSrc.includes('playlist-test-2'),
  );
  await playing();
  await page.getByTitle('Previous (Ctrl+Left)').click();
  await main.getByRole('button', { name: 'Pause Test audio 1', exact: true }).waitFor();
  await page.getByTitle('Download song for offline listening').click();
  await page.getByTitle('Saved in App Storage (Offline)').waitFor();
  await page.goto(new URL('library/', root).href);
  offline = true;
  await main.getByText('Downloaded Songs', { exact: true }).click();
  await page.waitForFunction(() => document.querySelector('audio')?.currentSrc.startsWith('blob:'));
  await playing();
}

async function run() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // A provider outage must leave the library and local search usable.
    await page.route('https://api.jamendo.com/**', (route) => route.abort());
    await page.route('https://itunes.apple.com/**', (route) => route.abort());
    await verifyLibrary(page);
    await verifyImport(page);
    await verifyQueueAndOfflinePlayback(page);
    assert.deepEqual(errors, []);
    console.log(
      'Playlist search, editing, persistence, keyboard navigation, JSON import, queue navigation and offline playback passed.',
    );
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
