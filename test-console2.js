const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (response.status() === 404) {
      console.log(`[404] ${response.url()}`);
    }
  });
  
  try {
    await page.goto('http://localhost:4174', { waitUntil: 'networkidle0' });
  } catch(e) {
    console.log("Could not load page:", e.message);
  }
  
  await browser.close();
})();
