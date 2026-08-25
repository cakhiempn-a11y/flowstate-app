const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

const target = `  const startMs = Date.now();
  const logs: string[] = [];`;

const replacement = `  const testNowStr = req.query.testNow as string;
  const now = testNowStr ? new Date(testNowStr) : new Date();
  const startMs = Date.now();
  const logs: string[] = [];`;

code = code.replace(target, replacement);

fs.writeFileSync('api/process-notifications.ts', code);
console.log("Patched now");
