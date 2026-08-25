const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const oldCode = `  const sendTestNotification = async () => {
    if (!tokenStr) {
      setErrorMsg("No token available. Please enable notifications first.");
      return;
    }
    setTestStatus('Sending...');
    try {
      const res = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenStr, title: 'FlowState', body: 'Thông báo thử nghiệm' })
      });
      if (!res.ok) {
         const errData = await res.json().catch(() => ({}));
         throw new Error(errData.error || \`Server returned \${res.status}\`);
      }
      setTestStatus('Test notification sent!');
      setTimeout(() => setTestStatus(''), 3000);
    } catch (e: any) {
      console.error('Test Notification Error:', e);
      setTestStatus(\`Error: \${e.message}\`);
    }
  };`;

const newCode = `  const sendTestNotification = async () => {
    if (!tokenStr) {
      setErrorMsg("No token available. Please enable notifications first.");
      return;
    }
    setTestStatus('Sending...');
    try {
      const res = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenStr, title: 'FlowState', body: 'Thông báo thử nghiệm' })
      });
      if (!res.ok) {
         const errData = await res.json().catch(() => ({}));
         
         if (errData.code === 'messaging/invalid-registration-token' || errData.code === 'messaging/registration-token-not-registered') {
           localStorage.removeItem('flowstate_fcm_token');
           setTokenStr('');
         }
         
         throw new Error(errData.error || \`Server returned \${res.status}\`);
      }
      setTestStatus('Test notification sent!');
      setTimeout(() => setTestStatus(''), 3000);
    } catch (e: any) {
      console.error('Test Notification Error:', e);
      setTestStatus(\`Error: \${e.message}\`);
    }
  };`;

if (code.includes(oldCode)) {
  fs.writeFileSync('src/pages/Settings.tsx', code.replace(oldCode, newCode));
  console.log("Patched correctly");
} else {
  console.log("Could not find old code");
}
