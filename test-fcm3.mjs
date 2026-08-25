import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    permissions: ['notifications']
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000);
  
  // Inject a script that imports the bundled Firebase code or we can just import the ESM directly
  // from esm.sh for testing the generic behavior
  await page.evaluate(async () => {
    try {
      const { initializeApp } = await import('https://esm.sh/firebase@10.8.0/app');
      const { getMessaging, getToken } = await import('https://esm.sh/firebase@10.8.0/messaging');
      
      const app = initializeApp({
        projectId: "demo-project", // Just anything, or the real config
        appId: "1:123:web:123",
        messagingSenderId: "123",
        apiKey: "fake-key"
      });
      const messaging = getMessaging(app);
      
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      console.log('Calling getToken...');
      const token = await getToken(messaging, {
        vapidKey: "BNFAKEVAPIDKEY...", 
        serviceWorkerRegistration: reg
      });
      console.log('Token:', token);
    } catch (e) {
      console.log('FCM ERROR:', e.code, e.message);
    }
  });

  await browser.close();
})();
