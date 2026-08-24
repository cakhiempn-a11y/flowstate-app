const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

code = code.replace(/} catch \(err: any\) {\n      setError\(t\('profile\.uploadFailed'\)/g, "} catch (err: any) {\n      console.error('Avatar Error:', err);\n      setError(t('profile.uploadFailed')");

fs.writeFileSync('src/components/ProfileSection.tsx', code);
