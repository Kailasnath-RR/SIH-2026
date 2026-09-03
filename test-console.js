const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[BROWSER ERROR] ${error.message}`);
  });
  
  try {
    await page.goto('http://localhost:4174', { waitUntil: 'networkidle0' });
  } catch(e) {
    console.log("Could not load page:", e.message);
  }
  
  await browser.close();
})();
