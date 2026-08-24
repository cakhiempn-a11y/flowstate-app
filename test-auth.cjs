const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('button:has-text("Google")');
  
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
