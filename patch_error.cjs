const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

code = code.replace(/setError\(err\.message\);/g, "setError(t('profile.uploadFailed') || 'Operation failed');");

fs.writeFileSync('src/components/ProfileSection.tsx', code);
console.log('Error patched.');
