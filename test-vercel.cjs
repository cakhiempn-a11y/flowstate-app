const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to root, which will redirect to /login client-side
  await page.goto('https://flowstate-app-tan.vercel.app/');
  
  // Wait for the login page to render
  await page.waitForSelector('button:has-text("Google")');
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  page.on('dialog', async dialog => {
    console.log('Dialog:', dialog.message());
    await dialog.accept();
  });

  const [popup] = await Promise.all([
    page.waitForEvent('popup').catch(() => null),
    page.click('button:has-text("Google")')
  ]);
  
  await page.waitForTimeout(3000);
  const errorText = await page.evaluate(() => {
    const el = document.querySelector('.bg-red-50');
    return el ? el.innerText : 'No error displayed';
  });
  console.log("Error in UI:", errorText);
  await browser.close();
})();
