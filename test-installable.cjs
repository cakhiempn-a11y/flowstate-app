const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-features=WebManifest'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let installPromptFired = false;
  let appInstalled = false;
  
  await page.exposeFunction('onInstallPrompt', () => {
    installPromptFired = true;
    console.log('>>> beforeinstallprompt fired!');
  });
  
  await page.exposeFunction('onAppInstalled', () => {
    appInstalled = true;
    console.log('>>> appinstalled fired!');
  });
  
  await page.addInitScript(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.onInstallPrompt();
    });
    window.addEventListener('appinstalled', () => {
      window.onAppInstalled();
    });
  });
  
  console.log("Navigating to production...");
  await page.goto('https://flowstate-app-tan.vercel.app/', { waitUntil: 'networkidle' });
  
  // check sw
  const sw = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      scope: reg ? reg.scope : null,
      active: reg && reg.active ? reg.active.state : null,
      controller: !!navigator.serviceWorker.controller
    };
  });
  
  console.log("Service Worker state:", sw);
  
  // Trigger a user gesture (sometimes required for installability heuristics, though beforeinstallprompt can fire before)
  await page.click('body');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("Install prompt fired:", installPromptFired);
  
  await browser.close();
})();
