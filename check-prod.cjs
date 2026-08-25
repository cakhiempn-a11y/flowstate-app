const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
  
  await page.goto('https://flowstate-app-tan.vercel.app/login', { waitUntil: 'networkidle' });
  
  console.log("Navigated to login.");
  
  const urlBefore = page.url();
  console.log("URL before clicking:", urlBefore);
  
  // Try to find if diagnostics are deployed
  const diagText = await page.evaluate(() => {
    const diag = document.querySelector('.bg-black.text-lime-400');
    return diag ? diag.innerText : 'Diagnostics not found on Vercel';
  });
  console.log("Diagnostics block:", diagText);

  // click Google login
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Google'));
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(5000); // Wait for redirect/popup
  
  const urlAfter = page.url();
  console.log("URL after clicking Google:", urlAfter);
  console.log("Console Logs:", logs);
  
  await browser.close();
})();
