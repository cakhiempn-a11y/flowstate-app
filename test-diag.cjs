const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Start server locally for a quick test
  const { exec } = require('child_process');
  const server = exec('npm run start');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const response = await page.goto('http://localhost:3000/');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const diagText = await page.evaluate(() => {
      const diag = document.querySelector('div[style*="z-index: 99999"]');
      return diag ? diag.innerText : 'No diag found';
    });
    
    console.log("Diagnostic text:", diagText);
    
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    server.kill();
    await browser.close();
  }
})();
