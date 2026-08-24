const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

code = code.replace(/} catch \(err: any\) {/, "} catch (err: any) {\n      console.error('Update Profile Error:', err);");

fs.writeFileSync('src/components/ProfileSection.tsx', code);
