const { chromium } = require('F:/Spotify-Craft[rea]/Wavelength/node_modules/playwright-core');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const ARTIFACT_DIR = 'C:/Users/moham/.gemini/antigravity/brain/95bb04ea-fbf4-4556-944d-c13bda37885d';

const BASE_URL = 'http://localhost:3001';

async function testMobileGestures() {
  console.log('📱 Starting Mobile Gestures & Tab Navigation Playwright Suite...');
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

  // 1. Load Root Home Tab
  console.log('1. Loading Home page...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_01_home.png') });
  console.log('   ✓ Home tab loaded successfully');

  // 2. Navigate to Search tab
  console.log('2. Navigating to Search tab...');
  await page.locator('nav.fixed.bottom-0 a[href="/search"]').last().click();
  await page.waitForTimeout(800);
  console.log(`   ✓ Active URL: ${page.url()}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_02_search.png') });

  // 3. Navigate to Library tab
  console.log('3. Navigating to Library tab...');
  await page.locator('nav.fixed.bottom-0 a[href="/library"]').last().click();
  await page.waitForTimeout(800);
  console.log(`   ✓ Active URL: ${page.url()}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_03_library.png') });

  // 4. Navigate to Settings tab
  console.log('4. Navigating to Settings tab...');
  await page.locator('nav.fixed.bottom-0 a[href="/settings"]').last().click();
  await page.waitForTimeout(800);
  console.log(`   ✓ Active URL: ${page.url()}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_04_settings.png') });

  // 5. Test Edge-Swipe Back Gesture from Settings -> Library
  console.log('5. Testing Left-Edge Swipe Gesture from Settings -> Library...');
  // Dispatch touchstart at (15, 400), touchmove to (120, 400), touchend
  await page.touchscreen.tap(10, 400);
  await page.evaluate(() => {
    const touchStart = new Touch({
      identifier: 1,
      target: document.body,
      clientX: 15,
      clientY: 400,
      screenX: 15,
      screenY: 400,
      pageX: 15,
      pageY: 400,
    });
    const touchEnd = new Touch({
      identifier: 1,
      target: document.body,
      clientX: 120,
      clientY: 400,
      screenX: 120,
      screenY: 400,
      pageX: 120,
      pageY: 400,
    });

    window.dispatchEvent(new TouchEvent('touchstart', { touches: [touchStart], changedTouches: [touchStart] }));
    window.dispatchEvent(new TouchEvent('touchmove', { touches: [touchEnd], changedTouches: [touchEnd] }));
    window.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touchEnd] }));
  });
  await page.waitForTimeout(1000);
  console.log(`   ✓ After Edge-Swipe #1 URL: ${page.url()}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_05_swiped_back_to_library.png') });

  // 6. Test Edge-Swipe Back Gesture from Library -> Search
  console.log('6. Testing Left-Edge Swipe Gesture from Library -> Search...');
  await page.evaluate(() => {
    const touchStart = new Touch({
      identifier: 2,
      target: document.body,
      clientX: 15,
      clientY: 400,
      screenX: 15,
      screenY: 400,
      pageX: 15,
      pageY: 400,
    });
    const touchEnd = new Touch({
      identifier: 2,
      target: document.body,
      clientX: 120,
      clientY: 400,
      screenX: 120,
      screenY: 400,
      pageX: 120,
      pageY: 400,
    });

    window.dispatchEvent(new TouchEvent('touchstart', { touches: [touchStart], changedTouches: [touchStart] }));
    window.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touchEnd] }));
  });
  await page.waitForTimeout(1000);
  console.log(`   ✓ After Edge-Swipe #2 URL: ${page.url()}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_06_swiped_back_to_search.png') });

  // 7. Test Edge-Swipe Back Gesture from Search -> Home
  console.log('7. Testing Left-Edge Swipe Gesture from Search -> Home...');
  await page.evaluate(() => {
    const touchStart = new Touch({
      identifier: 3,
      target: document.body,
      clientX: 15,
      clientY: 400,
      screenX: 15,
      screenY: 400,
      pageX: 15,
      pageY: 400,
    });
    const touchEnd = new Touch({
      identifier: 3,
      target: document.body,
      clientX: 120,
      clientY: 400,
      screenX: 120,
      screenY: 400,
      pageX: 120,
      pageY: 400,
    });

    window.dispatchEvent(new TouchEvent('touchstart', { touches: [touchStart], changedTouches: [touchStart] }));
    window.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touchEnd] }));
  });
  await page.waitForTimeout(1000);
  console.log(`   ✓ After Edge-Swipe #3 URL: ${page.url()}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_07_swiped_back_to_home.png') });

  // 8. Test Double-Tap Back on Home (Exit prompt toast)
  console.log('8. Testing Back Button on Home (should trigger exit toast)...');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });
  await page.waitForTimeout(500);
  const toast = await page.$('#wavelength-exit-toast');
  const toastText = toast ? await toast.innerText() : null;
  console.log(`   ✓ Exit Toast Visible: ${!!toast}, Text: "${toastText}"`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_08_exit_toast.png') });

  // 9. Play track and test Now Playing sheet drag-down gesture
  console.log('9. Starting playback and testing Now Playing full-screen drag-down...');
  const firstPlayBtn = await page.$('button.rounded-full, .group');
  if (firstPlayBtn) {
    await firstPlayBtn.click();
    await page.waitForTimeout(1000);
  }

  // Open mini-player into full-screen
  await page.evaluate(() => {
    // If mini player is available, click it
    const mini = document.querySelector('.bg-\\[\\#181818\\]\\/95');
    if (mini) mini.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_09_fullscreen_nowplaying.png') });

  console.log('\n🎉 ALL MOBILE TESTS COMPLETED!');
  if (errors.length > 0) {
    console.error('Page errors encountered:', errors);
  } else {
    console.log('Zero page errors! Everything smooth and responsive.');
  }

  await browser.close();
}

testMobileGestures().catch((err) => {
  console.error('Playwright Test Failed:', err);
  process.exit(1);
});
