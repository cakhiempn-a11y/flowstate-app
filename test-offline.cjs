const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Start server locally for a quick test
  const { exec } = require('child_process');
  const server = exec('npm run start');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const response = await page.goto('http://localhost:3000/');
    console.log("Initial load status:", response.status());
    
    // Wait for SW to install
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Go offline
    await context.setOffline(true);
    console.log("Browser is now offline.");
    
    // Try to load again
    const offlineResponse = await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    console.log("Offline load status:", offlineResponse ? offlineResponse.status() : 'No response');
    
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    server.kill();
    await browser.close();
  }
})();
