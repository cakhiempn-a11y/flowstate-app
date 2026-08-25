const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

const target = `    if (!app) {
      return res.status(500).json({
        success: false,
        stage: 'admin-init',
        error: initError || 'Firebase Admin not initialized.'
      });
    }`;

const replacement = `    if (!app) {
      console.error(\`[process-notifications] stage=admin-init error=\${initError || 'Firebase Admin not initialized.'}\`);
      return res.status(500).json({
        success: false,
        stage: 'admin-init',
        error: initError || 'Firebase Admin not initialized.'
      });
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('api/process-notifications.ts', code);
console.log("Patched admin init for logging");
