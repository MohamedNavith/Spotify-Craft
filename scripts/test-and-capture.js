const { chromium } = require('playwright-core');
const path = require('node:path');
const assert = require('node:assert/strict');

const base = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3333';
const directory = path.join(__dirname, '..', 'docs', 'screenshots');

async function capture(page, name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visible = Array.from(document.images).filter(image => {
      const box = image.getBoundingClientRect();
      return box.bottom > 0 && box.top < innerHeight && box.width > 0;
    });
    await Promise.race([
      Promise.allSettled(visible.map(image => image.decode())),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]);
  });
  await page.screenshot({ path: path.join(directory, name), animations: 'disabled' });
}

async function run() {
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({
        viewport: mobile ? { width: 393, height: 852 } : { width: 1440, height: 900 },
        deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile,
      });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'load' });
      await page.getByText('Made For You', { exact: true }).first().waitFor();
      await capture(page, mobile ? '05_mobile_home.png' : '01_desktop_home.png');
      const nav = page.getByRole('navigation', { name: 'Primary' });
      await (mobile ? nav.getByText('Search') : page.getByTitle('Browse all categories')).click();
      const category = page.getByRole('button', { name: 'Pop Hits', exact: true });
      await category.waitFor();
      await capture(page, mobile ? 'mobile-browse.png' : '03_desktop_search.png');
      await category.focus();
      await page.keyboard.press('Enter');
      const field = page.getByRole('textbox', { name: 'Search the catalog' });
      assert.match(await field.inputValue(), /Pop Music/);
      await page.getByRole('button', { name: 'Clear catalog search' }).click();
      await category.waitFor();
      if (mobile) {
        await nav.getByText('Settings').click();
        await page.getByRole('heading', { name: 'Playback & Audio Quality' }).waitFor();
        assert.equal(await nav.getByRole('link', { name: 'Settings' }).getAttribute('aria-current'), 'page');
      } else {
        const header = page.getByRole('textbox', { name: 'Search music' });
        for (const term of ['Sapphire', 'Starboy']) {
          await header.fill(term);
          await header.press('Enter');
          await page.waitForFunction(q => document.querySelector('[aria-label="Search the catalog"]')?.value === q, term);
        }
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
