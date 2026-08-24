const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-features=WebManifest'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const client = await page.context().newCDPSession(page);
  await page.goto('https://flowstate-app-tan.vercel.app/', { waitUntil: 'networkidle' });
  const response = await client.send('Page.getInstallabilityErrors');
  console.log("Installability Errors:", JSON.stringify(response.installabilityErrors, null, 2));
  const manifest = await client.send('Page.getAppManifest');
  console.log("Manifest Errors:", JSON.stringify(manifest.errors, null, 2));
  console.log("Manifest Parsed:", !!manifest.data);
  await browser.close();
})();
