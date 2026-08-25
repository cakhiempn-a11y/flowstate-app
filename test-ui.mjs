import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    permissions: ['notifications']
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:3000/settings');
  await page.waitForTimeout(1000);
  
  // Wait, the settings page is protected by login.
  // We can inject a mock auth state or create an account.
  
  await browser.close();
})();
