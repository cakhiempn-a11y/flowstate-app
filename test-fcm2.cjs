const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    permissions: ['notifications']
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:3000/');
  
  await page.evaluate(async () => {
     try {
         // Create a fake SW registration
         const reg = await navigator.serviceWorker.register('/sw.js');
         await navigator.serviceWorker.ready;
         console.log('SW Ready', reg.active.state);

         // Import the actual firebase code from our app
         const { getMessagingInstance } = await import('/src/firebase.ts');
         const messaging = await getMessagingInstance();
         
         const { getToken } = await import('/node_modules/firebase/messaging/dist/esm/index.esm.js');
         const vapidKey = import.meta.env ? import.meta.env.VITE_FCM_VAPID_KEY : null; // Won't work in eval, we need to pass it
     } catch (e) {
         console.error(e);
     }
  });

  await browser.close();
})();
