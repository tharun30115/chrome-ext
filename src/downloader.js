const puppeteer = require('puppeteer');
const axios = require('axios');

async function downloadInstagramVideo(url) {
  if (!url.includes('instagram.com')) throw new Error('Invalid Instagram URL');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // ✅ Set realistic headers
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // ✅ Close login modal if it exists
    try {
      await page.waitForSelector('div[role="dialog"] button', { timeout: 5000 });
      await page.click('div[role="dialog"] button');
    } catch (_) {}

    // ✅ Scroll to force media load
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(res => setTimeout(res, 3000));

    // ✅ Try to extract video URL
    const videoUrl = await page.evaluate(() => {
      const videoEl = document.querySelector('video');
      return videoEl?.src || null;
    });

    if (!videoUrl) throw new Error('Video URL not found (even after scroll)');

    const videoRes = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    return Buffer.from(videoRes.data);
  } catch (err) {
    throw new Error(`Failed to extract video: ${err.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = { downloadInstagramVideo };
