const assert = require('node:assert/strict');
const { chromium } = require('F:/Spotify-Craft[rea]/Wavelength/node_modules/playwright-core');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/moham/.gemini/antigravity/brain/95bb04ea-fbf4-4556-944d-c13bda37885d';
const BASE_URL = 'http://localhost:3001';

async function swipeLeftEdge(page, id = 1) {
  await page.evaluate((touchId) => {
    const t0 = new Touch({
      identifier: touchId,
      target: document.body,
      clientX: 15,
      clientY: 400,
      screenX: 15,
      screenY: 400,
      pageX: 15,
      pageY: 400,
    });
    const t1 = new Touch({
      identifier: touchId,
      target: document.body,
      clientX: 120,
      clientY: 400,
      screenX: 120,
      screenY: 400,
      pageX: 120,
      pageY: 400,
    });
    window.dispatchEvent(new TouchEvent('touchstart', { touches: [t0], changedTouches: [t0] }));
    window.dispatchEvent(new TouchEvent('touchmove', { touches: [t1], changedTouches: [t1] }));
    window.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t1] }));
  }, id);
  await page.waitForTimeout(750);
}

async function testMobileGestures() {
  console.log('📱 Starting Strict LIFO & Mobile Gestures Playwright Suite...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const primaryNav = page.getByRole('navigation', { name: 'Primary' });

  // 1. Load Root Home Tab
  console.log('1. Loading Home page...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const homeAriaCurrent = await primaryNav.getByRole('link', { name: 'Home' }).getAttribute('aria-current');
  assert.equal(homeAriaCurrent, 'page', 'Home tab should have aria-current="page"');

  // 2. Navigate: Home -> Search
  console.log('2. Navigating to Search tab...');
  await primaryNav.getByRole('link', { name: 'Search' }).click();
  await page.waitForTimeout(700);
  assert.match(page.url(), /\/search\/?$/, 'Expected /search');
  const searchAriaCurrent = await primaryNav.getByRole('link', { name: 'Search' }).getAttribute('aria-current');
  assert.equal(searchAriaCurrent, 'page', 'Search tab should highlight even with trailingSlash');

  // 3. Navigate into Playlist with query string: Search -> Playlist (/playlist?id=collection-chillLoFi)
  console.log('3. Opening Chill Waves playlist (/playlist?id=collection-chillLoFi)...');
  await page.getByRole('textbox', { name: 'Search the catalog' }).fill('chi');
  await page.locator('main').getByRole('link', { name: /Chill Waves/ }).first().click();
  await page.waitForTimeout(700);
  assert.match(page.url(), /\/playlist\/?\?id=collection-chillLoFi/, 'Expected playlist URL with ?id=');

  // 4. Navigate: Playlist -> Library -> Settings -> Home (re-visiting Home pushes Home on top of LIFO stack!)
  console.log('4. Navigating Library -> Settings -> Home (LIFO stack check)...');
  await primaryNav.getByRole('link', { name: 'Library' }).click();
  await page.waitForTimeout(600);
  assert.match(page.url(), /\/library\/?$/);

  await primaryNav.getByRole('link', { name: 'Settings' }).click();
  await page.waitForTimeout(600);
  assert.match(page.url(), /\/settings\/?$/);

  await primaryNav.getByRole('link', { name: 'Home' }).click();
  await page.waitForTimeout(600);
  assert.match(page.url(), /localhost:3001\/?$/);

  // 5. Strict LIFO Back Popping: / -> /settings -> /library -> /playlist?id=collection-chillLoFi -> /search -> /
  console.log('5. Verifying strict LIFO back popping across stack...');
  await swipeLeftEdge(page, 1);
  console.log('   LIFO Pop 1 ->', page.url());
  assert.match(page.url(), /\/settings\/?$/, 'Exit from re-visited Home must pop LIFO to /settings');

  await swipeLeftEdge(page, 2);
  console.log('   LIFO Pop 2 ->', page.url());
  assert.match(page.url(), /\/library\/?$/, 'LIFO pop #2 must return to /library');

  await swipeLeftEdge(page, 3);
  console.log('   LIFO Pop 3 ->', page.url());
  assert.match(page.url(), /\/playlist\/?\?id=collection-chillLoFi/, 'LIFO pop #3 must preserve ?id= on playlist');
  await page.locator('main').getByRole('heading', { name: /Chill Waves/ }).waitFor();

  await swipeLeftEdge(page, 4);
  console.log('   LIFO Pop 4 ->', page.url());
  assert.match(page.url(), /\/search\/?$/, 'LIFO pop #4 must return to /search');

  await swipeLeftEdge(page, 5);
  console.log('   LIFO Pop 5 ->', page.url());
  assert.match(page.url(), /localhost:3001\/?$/, 'LIFO pop #5 must return to root /');

  // 6. On root Home at bottom of LIFO stack -> Next back triggers exit toast!
  console.log('6. Verifying root-bottom Exit Toast...');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });
  await page.waitForTimeout(300);
  const toastText = await page.locator('#wavelength-exit-toast').innerText();
  assert.match(toastText, /Press back again to exit/);
  console.log('   ✓ Exit toast confirmed at bottom of stack:', toastText);

  // 7. Verify Modal Overlay LIFO Stack: Track Play -> Expanded Now Playing -> Lyrics -> Back closes Lyrics FIRST, then Now Playing!
  console.log('7. Testing Overlay LIFO stack (Now Playing -> Lyrics -> Back LIFO)...');
  await page.locator('main button[aria-label^="Play "]').first().click();
  await page.waitForTimeout(800);

  // Tap mini-player to expand full-screen Now Playing
  await page.locator('.wl-mini button[aria-label="Expand now playing"]').click();
  await page.waitForTimeout(600);
  await page.getByText('Playing from Album').waitFor();

  // Open Lyrics on top of Expanded Now Playing
  await page.getByText('Tap for karaoke ↑').click();
  await page.waitForTimeout(600);
  await page.getByText('Live Karaoke Lyrics').waitFor();

  // Back #1 MUST close Lyrics first while keeping Now Playing open!
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  await page.waitForTimeout(500);
  const lyricsStillVisible = await page.getByText('Live Karaoke Lyrics').isVisible().catch(() => false);
  assert.equal(lyricsStillVisible, false, 'Lyrics modal must close first (LIFO)');
  const nowPlayingStillVisible = await page.getByText('Playing from Album').isVisible();
  assert.equal(nowPlayingStillVisible, true, 'Expanded Now Playing must stay open after popping Lyrics');
  console.log('   ✓ Overlay LIFO Pop 1 closed Lyrics while preserving Expanded Now Playing');

  // Back #2 MUST collapse Expanded Now Playing back to mini-player!
  await swipeLeftEdge(page, 6);
  const nowPlayingAfterSecondBack = await page.getByText('Playing from Album').isVisible().catch(() => false);
  assert.equal(nowPlayingAfterSecondBack, false, 'Second back must collapse Now Playing');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_lifo_verified.png') });
  console.log('   ✓ Overlay LIFO Pop 2 collapsed Now Playing back to mini-player');

  assert.equal(errors.length, 0, `Unexpected page errors: ${errors.join('; ')}`);
  console.log('\n🎉 ALL LIFO STACK & MOBILE GESTURE TESTS PASSED WITH ZERO ERRORS!');
  await browser.close();
}

testMobileGestures().catch((err) => {
  console.error('❌ Playwright LIFO Test Failed:', err);
  process.exit(1);
});
