const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const client = await page.context().newCDPSession(page);
  
  await page.goto('https://flowstate-app-tan.vercel.app/');
  
  const response = await client.send('Page.getInstallabilityErrors');
  console.log("Installability Errors:", response);
  
  const manifest = await client.send('Page.getAppManifest');
  console.log("Manifest Errors:", manifest.errors);
  
  await browser.close();
})();
