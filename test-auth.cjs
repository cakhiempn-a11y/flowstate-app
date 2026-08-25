const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to vercel origin
  await page.goto('https://flowstate-app-tan.vercel.app');
  
  const result = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.innerHTML = `
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
        import { getAuth, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
        
        const app = initializeApp({
          projectId: "ai-studio-applet-webapp-1f194",
          apiKey: "AIzaSyA4EPaIQQPtq84sLGRVCdvrGQp_KJY_xcU",
          authDomain: "ai-studio-applet-webapp-1f194.firebaseapp.com"
        });
        
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        
        signInWithPopup(auth, provider).catch(err => {
          window.authError = err.code + ": " + err.message;
        });
      `;
      document.body.appendChild(script);
      
      setTimeout(() => {
        resolve(window.authError || "No error (popup might have opened)");
      }, 3000);
    });
  });
  
  console.log("Auth Test Result:", result);
  await browser.close();
})();
