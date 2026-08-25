const https = require('https');

https.get('https://flowstate-app-tan.vercel.app/assets/index-Deqy44Rk.js', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // Look for RequireAuth component or similar logic
    const idx = data.indexOf('Navigate');
    const authContextIdx = data.indexOf('AuthContext.Provider');
    console.log("Found AuthContext.Provider:", authContextIdx > -1);
    
    // Look for useState(false) near AuthContext
    // This is minified, so it might be e.useState(!1) or e.useState(false)
    const contextSnip = data.substring(Math.max(0, authContextIdx - 500), authContextIdx + 100);
    console.log("Auth context snippet:");
    console.log(contextSnip);
  });
});
