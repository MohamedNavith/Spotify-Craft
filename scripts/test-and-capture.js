const { chromium } = require('F:/Spotify-Craft[rea]/Wavelength/node_modules/playwright-core');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:3333';

async function run() {
  console.log('🚀 Launching Chrome via Playwright for comprehensive UI inspection...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const errors = [];

  // ==========================================
  // 1. DESKTOP EXPERIENCE (1440x900)
  // ==========================================
  console.log('\n💻 Capturing Desktop Workflows (1440x900 Retina)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  desktopPage.on('pageerror', (err) => errors.push(`Desktop: ${err.message}`));

  // 1.1 Home View
  await desktopPage.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_desktop_home.png') });
  console.log('  ✓ 01_desktop_home.png');

  // 1.2 Start playing track
  const trackCard = await desktopPage.$('.group');
  if (trackCard) {
    await trackCard.click();
    await desktopPage.waitForTimeout(600);
  }

  // 1.3 Streaming Quality Settings Modal
  await desktopPage.goto(`${BASE_URL}/settings.html`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_desktop_streaming_quality.png') });
  console.log('  ✓ 02_desktop_streaming_quality.png');

  // 1.4 Search Page with Categories
  await desktopPage.goto(`${BASE_URL}/search.html`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_desktop_search.png') });
  console.log('  ✓ 03_desktop_search.png');

  // 1.5 Desktop Karaoke Lyrics View
  // Go back to Home and open Lyrics modal
  await desktopPage.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(600);
  const lyricsBtn = await desktopPage.$('button[title*="Lyrics"], button:has(svg.lucide-mic-2)');
  if (lyricsBtn) {
    await lyricsBtn.click();
    await desktopPage.waitForTimeout(1200);
    await desktopPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_desktop_lyrics.png') });
    console.log('  ✓ 04_desktop_lyrics.png');
  }

  await desktopContext.close();

  // ==========================================
  // 2. MOBILE EXPERIENCE (Pixel 7 / S25 Ultra 393x852)
  // ==========================================
  console.log('\n📱 Capturing Mobile Workflows (393x852 Native Mobile)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  mobilePage.on('pageerror', (err) => errors.push(`Mobile: ${err.message}`));

  // 2.1 Mobile Home
  await mobilePage.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_mobile_home.png') });
  console.log('  ✓ 05_mobile_home.png');

  // 2.2 Click a song to trigger Floating Mini Player
  const mobileCard = await mobilePage.$('.group');
  if (mobileCard) {
    await mobileCard.click();
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_mobile_mini_player.png') });
    console.log('  ✓ 06_mobile_mini_player.png');
  }

  // 2.3 Expand into Full-Screen Mobile Player
  const miniPlayerBar = await mobilePage.$('div[class*="backdrop-blur-xl"]');
  if (miniPlayerBar) {
    await miniPlayerBar.click();
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_mobile_now_playing.png') });
    console.log('  ✓ 07_mobile_now_playing.png');
  }

  // 2.4 Tap Lyrics Pull-Up Pill to launch Live Karaoke Lyrics
  const lyricsPill = await mobilePage.$('text="Lyrics preview", text="Tap for karaoke"');
  if (lyricsPill) {
    await lyricsPill.click();
    await mobilePage.waitForTimeout(1200);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_mobile_lyrics.png') });
    console.log('  ✓ 08_mobile_lyrics.png');

    // Close lyrics modal
    const closeBtn = await mobilePage.$('button:has(svg.lucide-x)');
    if (closeBtn) await closeBtn.click();
    await mobilePage.waitForTimeout(400);
  }

  // 2.5 Mobile Settings Streaming Quality Modal
  await mobilePage.goto(`${BASE_URL}/settings.html`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_mobile_streaming_quality.png') });
  console.log('  ✓ 09_mobile_streaming_quality.png');

  await mobileContext.close();
  await browser.close();

  console.log('\n==========================================');
  console.log(`🎉 Playwright Screenshot Suite completed with ${errors.length} errors!`);
}

run().catch((err) => {
  console.error('Playwright execution error:', err);
  process.exit(1);
});
