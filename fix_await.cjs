const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');
code = code.replace(/await await refreshUser\(\);/g, "await refreshUser();");
fs.writeFileSync('src/components/ProfileSection.tsx', code);
