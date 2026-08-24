const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://flowstate-app-tan.vercel.app/');
  
  // wait for SW to install
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // check cache
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    if (keys.length === 0) return 'No caches';
    const cache = await caches.open(keys[0]);
    const reqs = await cache.keys();
    return reqs.map(r => r.url);
  });
  
  console.log("Cached items:", cached);
  
  await browser.close();
})();
