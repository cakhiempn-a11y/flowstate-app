const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const response = await page.goto('http://localhost:3000/');
    const manifestHandle = await page.$('link[rel="manifest"]');
    const manifestHref = await manifestHandle.evaluate(el => el.href);
    console.log("Manifest link found:", manifestHref);
    
    const manifestResponse = await page.goto(manifestHref);
    const manifestJson = await manifestResponse.json();
    console.log("Manifest JSON parsed successfully. name:", manifestJson.name);
    console.log("display:", manifestJson.display);
    
    // Check SW
    await page.goto('http://localhost:3000/');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const swRegs = await context.serviceWorkers();
    console.log("Service workers registered count:", swRegs.length);
    if (swRegs.length > 0) {
      console.log("Service worker URL:", swRegs[0].url());
    }
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    await browser.close();
  }
})();
