const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    await page.goto('http://localhost:4174', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'map-screenshot.png' });
    console.log("Screenshot saved to map-screenshot.png");
  } catch(e) {
    console.log("Could not load page:", e.message);
  }
  
  await browser.close();
})();
