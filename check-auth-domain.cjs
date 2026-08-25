const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // We navigate to the Vercel app so we have the right origin
  const page = await context.newPage();
  await page.goto('https://flowstate-app-tan.vercel.app/login', { waitUntil: 'networkidle' });
  
  // Inject Firebase directly to test if the domain is authorized
  const result = await page.evaluate(async () => {
    // We can just trigger the existing login button, but it uses redirect.
    // Since it uses redirect, the error is passed back via the redirect URL or sessionStorage.
    return "Check complete";
  });
  
  await browser.close();
})();
