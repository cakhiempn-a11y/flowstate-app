const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

const oldCode1 = `const now = new Date();
  const testTime = req.query.testTime as string;
  const testDate = req.query.testDate as string;`;
const newCode1 = `const testNowStr = req.query.testNow as string;
  const now = testNowStr ? new Date(testNowStr) : new Date();`;

const oldCode2 = `const localDateStr = testDate || formatInTimeZone(now, tz, 'yyyy-MM-dd');
      const localTimeStr = testTime || formatInTimeZone(now, tz, 'HH:mm');`;
const newCode2 = `const localDateStr = formatInTimeZone(now, tz, 'yyyy-MM-dd');
      const localTimeStr = formatInTimeZone(now, tz, 'HH:mm');`;

code = code.replace(oldCode1, newCode1).replace(oldCode2, newCode2);
fs.writeFileSync('api/process-notifications.ts', code);
