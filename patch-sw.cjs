const fs = require('fs');
let code = fs.readFileSync('public/sw.js', 'utf8');

// Update cache name to ensure clients get new sw logic
code = code.replace("const CACHE_NAME = 'flowstate-cache-v4';", "const CACHE_NAME = 'flowstate-cache-v5';");

// Add notification icon to static assets
const assetsTarget = `  '/icons/icon-512.png'
];`;
const assetsReplacement = `  '/icons/icon-512.png',
  '/icons/notification-icon.png'
];`;
code = code.replace(assetsTarget, assetsReplacement);

// Fix options in push handler
const optionsTarget = `  const options = {
    body: body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url },
    vibrate: [100, 50, 100],
  };`;
const optionsReplacement = `  const options = {
    body: body,
    icon: '/icons/notification-icon.png',
    data: { url },
    vibrate: [100, 50, 100],
  };`;
code = code.replace(optionsTarget, optionsReplacement);

fs.writeFileSync('public/sw.js', code);
console.log("Patched public/sw.js");
