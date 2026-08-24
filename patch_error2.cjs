const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

code = code.replace(/setError\(t\('profile\.uploadFailed'\) \|\| 'Operation failed'\);/g, "setError(t('profile.saveFailed') || 'Operation failed');");

fs.writeFileSync('src/components/ProfileSection.tsx', code);
