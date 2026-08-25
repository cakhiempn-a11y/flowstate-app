const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Find where NotificationSettings starts
const startIdx = code.indexOf('function NotificationSettings({ settings, updateSettings, t }: any) {');
if (startIdx === -1) {
  console.error("Could not find NotificationSettings");
  process.exit(1);
}

// Find the end of NotificationSettings
// It ends right before `function DataSettings`
const endIdx = code.indexOf('function DataSettings({ t }: any) {');
if (endIdx === -1) {
  console.error("Could not find DataSettings");
  process.exit(1);
}

const robustComponent = `
function NotificationSettings({ settings, updateSettings, t }: any) {
  const [permission, setPermission] = useState(Notification.permission);
  const [tokenStr, setTokenStr] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [testStatus, setTestStatus] = useState('');

  // On mount, if we already have permission, we could try to get the token, but let's just let the user click if needed, or if we have it in localStorage we could load it.
  
  const requestPermission = async () => {
    setIsRequesting(true);
    setErrorMsg('');
    setStatusMsg('Requesting notification permission...');
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        setStatusMsg('Initializing Firebase Messaging...');
        const { getMessagingInstance } = await import('../firebase');
        const { getToken } = await import('firebase/messaging');
        const messaging = await getMessagingInstance();
        
        if (!messaging) {
          throw new Error("Firebase Messaging is not supported or failed to initialize.");
        }

        setStatusMsg('Registering Service Worker...');
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
           registration = await navigator.serviceWorker.register('/sw.js');
        }
        
        // Wait for it to be active to avoid hanging
        if (!registration.active) {
           setStatusMsg('Waiting for Service Worker to activate...');
           // we won't wait infinitely, just proceed, getToken might wait internally or fail
        }

        setStatusMsg('Getting FCM token...');
        const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
        if (!vapidKey) {
          throw new Error("VAPID Key is missing in environment variables.");
        }

        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });

        if (token) {
          setTokenStr(token);
          setStatusMsg('Saving device token to your account...');
          const { saveDeviceToken } = await import('../firebaseHelpers');
          await saveDeviceToken(token, 'web');
          setStatusMsg('Successfully registered for notifications!');
        } else {
          throw new Error("getToken returned empty.");
        }
      } else {
        throw new Error("Notification permission was denied.");
      }
    } catch (e: any) {
      console.error('Notification Setup Error:', e);
      setErrorMsg(e.message || "An unknown error occurred.");
      setStatusMsg('');
    } finally {
      setIsRequesting(false);
    }
  };

  const sendTestNotification = async () => {
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
  };

  const updateNotif = (updates: any) => {
    updateSettings({ notifications: { ...settings.notifications, ...updates } });
  };
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('settings.notifications') || 'Notifications'}</h2>
        
        <div className="mb-6 p-4 border border-border rounded-xl bg-card shadow-sm space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-foreground text-sm">System Notifications</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {permission === 'granted' && tokenStr 
                    ? 'Notifications enabled and device registered.' 
                    : 'Allow FlowState to send push notifications.'}
                </div>
              </div>
              {permission === 'granted' && tokenStr ? (
                <div className="flex items-center space-x-2 text-sm text-green-600 font-bold">
                  <CheckSquare className="w-5 h-5" /> <span>Enabled</span>
                </div>
              ) : (
                <button 
                  onClick={requestPermission} 
                  disabled={isRequesting}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {isRequesting ? 'Processing...' : 'Enable Notifications'}
                </button>
              )}
            </div>
            
            {statusMsg && !errorMsg && (
              <div className="text-sm text-blue-600 mt-2">{statusMsg}</div>
            )}
            
            {errorMsg && (
              <div className="text-sm text-red-600 font-semibold mt-2 bg-red-50 p-2 rounded border border-red-200">
                {errorMsg}
              </div>
            )}
          </div>

          {(permission === 'granted' || tokenStr) && (
            <div className="pt-4 border-t border-border space-y-2">
              <button 
                onClick={sendTestNotification}
                disabled={!tokenStr || testStatus === 'Sending...'}
                className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/80 w-full disabled:opacity-50 transition-colors"
              >
                {testStatus === 'Sending...' ? 'Sending...' : 'Send Test Notification'}
              </button>
              {testStatus && testStatus !== 'Sending...' && (
                <div className={\`text-center text-sm font-semibold \${testStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}\`}>
                  {testStatus}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card shadow-sm">
            <div>
              <div className="font-bold text-foreground text-sm">{t('settings.taskReminders')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('settings.remindBefore')}</div>
            </div>
            <div className="flex items-center space-x-4">
              {settings.notifications.taskReminders && (
                <Select
                  value={settings.notifications.reminderTime}
                  onChange={(value) => updateNotif({ reminderTime: parseInt(value) })}
                  className="w-32"
                  options={[
                    { value: "5", label: t('settings.min5') },
                    { value: "10", label: t('settings.min10') },
                    { value: "15", label: t('settings.min15') },
                    { value: "30", label: t('settings.min30') },
                    { value: "60", label: t('settings.hour1') }
                  ]}
                />
              )}
              <input
                type="checkbox"
                checked={settings.notifications.taskReminders}
                onChange={(e) => updateNotif({ taskReminders: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card shadow-sm">
            <div>
              <div className="font-bold text-foreground text-sm">{t('settings.overdueAlerts')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('settings.remindOverdue')}</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.overdueAlerts}
              onChange={(e) => updateNotif({ overdueAlerts: e.target.checked })}
              className="w-5 h-5 text-primary rounded"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card shadow-sm">
            <div>
              <div className="font-bold text-foreground text-sm">{t('settings.dailySummary')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('settings.remindSummary')}</div>
            </div>
            <div className="flex items-center space-x-4">
              {settings.notifications.dailySummary && (
                <TimeInput value={settings.notifications.dailySummaryTime} onChange={(val) => updateNotif({ dailySummaryTime: val })} className="w-[85px] text-sm border border-border rounded px-2 py-1 outline-none text-center" />
              )}
              <input
                type="checkbox"
                checked={settings.notifications.dailySummary}
                onChange={(e) => updateNotif({ dailySummary: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

`;

code = code.substring(0, startIdx) + robustComponent + code.substring(endIdx);
fs.writeFileSync('src/pages/Settings.tsx', code);
