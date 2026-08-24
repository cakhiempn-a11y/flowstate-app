const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const svg = fs.readFileSync('public/icons/logo.svg', 'utf8');
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; }
          svg { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        ${svg}
      </body>
    </html>
  `);
  
  await page.setViewportSize({ width: 192, height: 192 });
  await page.screenshot({ path: 'public/icons/icon-192.png', omitBackground: true });
  
  await page.setViewportSize({ width: 512, height: 512 });
  await page.screenshot({ path: 'public/icons/icon-512.png', omitBackground: true });
  
  await browser.close();
})();
