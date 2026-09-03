const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  try {
    await page.goto('http://localhost:4174', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000); // give it a moment to render
    const name = await page.$eval('#selectedName', el => el.textContent);
    console.log("SUCCESS. Selected name:", name);
  } catch(e) {
    console.log("FAILED:", e.message);
  }
  
  console.log("--- LOGS ---");
  console.log(logs.join('\n'));
  
  await browser.close();
})();
