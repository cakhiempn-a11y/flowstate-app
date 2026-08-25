const fs = require('fs');
const https = require('https');

https.get('https://flowstate-app-tan.vercel.app/assets/index-Deqy44Rk.js', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const projectIdMatch = data.match(/projectId\s*:\s*["']([^"']+)["']/i);
    const authDomainMatch = data.match(/authDomain\s*:\s*["']([^"']+)["']/i);
    const signInWithPopupMatch = data.match(/signInWithPopup/);
    const signInWithRedirectMatch = data.match(/signInWithRedirect/);
    
    console.log("projectId:", projectIdMatch ? projectIdMatch[1] : "not found");
    console.log("authDomain:", authDomainMatch ? authDomainMatch[1] : "not found");
    console.log("Uses signInWithPopup:", !!signInWithPopupMatch);
    console.log("Uses signInWithRedirect:", !!signInWithRedirectMatch);
  });
});
