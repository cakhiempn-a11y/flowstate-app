const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const startIdx = code.indexOf('function NotificationSettings({ settings, updateSettings, t }: any) {');
const endIdx = code.indexOf('function DataSettings({ t }: any) {');

const component = `
function NotificationSettings({ settings, updateSettings, t }: any) {
  const [permission, setPermission] = useState(Notification.permission);
  const [tokenStr, setTokenStr] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [testStatus, setTestStatus] = useState('');

  // On mount, check if we already have a token in localStorage to display registered state
  useEffect(() => {
     const savedToken = localStorage.getItem('flowstate_fcm_token');
     if (savedToken && Notification.permission === 'granted') {
        setTokenStr(savedToken);
     }
  }, []);
  
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
        
        if (!registration.active) {
           setStatusMsg('Waiting for Service Worker to activate...');
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
          localStorage.setItem('flowstate_fcm_token', token);
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
                  {permission === 'granted' 
                    ? (tokenStr ? 'Notifications enabled and device registered.' : 'Permission granted, but device not registered.')
                    : 'Allow FlowState to send push notifications.'}
                </div>
              </div>
              
              {permission === 'granted' ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-2 text-sm text-green-600 font-bold">
                    <CheckSquare className="w-5 h-5" /> <span>Enabled</span>
                  </div>
                  {tokenStr ? (
                    <div className="text-xs text-green-600 flex items-center mt-1">
                      <CheckSquare className="w-3 h-3 mr-1" /> Push device registered
                    </div>
                  ) : (
                    <div className="text-xs text-red-500 flex items-center mt-1">
                      ⚠ Push device registration failed
                    </div>
                  )}
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
            
            {/* If permission is granted but no token, we should let them retry */}
            {permission === 'granted' && !tokenStr && (
               <div className="pt-2">
                 <button 
                    onClick={requestPermission} 
                    disabled={isRequesting}
                    className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/80 disabled:opacity-50"
                  >
                    {isRequesting ? 'Registering...' : 'Retry Registration'}
                  </button>
               </div>
            )}

            {statusMsg && !errorMsg && (
              <div className="text-sm text-blue-600 mt-2">{statusMsg}</div>
            )}
            
            {errorMsg && (
              <div className="text-sm text-red-600 font-semibold mt-2 bg-red-50 p-2 rounded border border-red-200">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            {!tokenStr ? (
              <div className="p-3 bg-muted rounded-lg text-center">
                 <div className="text-sm font-bold text-foreground">Push device not registered</div>
                 <div className="text-xs text-muted-foreground mt-1">
                   You must enable notifications and successfully register this device before a test notification can be sent.
                 </div>
              </div>
            ) : (
              <>
                <button 
                  onClick={sendTestNotification}
                  disabled={testStatus === 'Sending...'}
                  className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/80 w-full transition-colors"
                >
                  {testStatus === 'Sending...' ? 'Sending...' : 'Send Test Notification'}
                </button>
                {testStatus && testStatus !== 'Sending...' && (
                  <div className={\`text-center text-sm font-semibold \${testStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}\`}>
                    {testStatus}
                  </div>
                )}
              </>
            )}
          </div>
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

code = code.substring(0, startIdx) + component + code.substring(endIdx);
fs.writeFileSync('src/pages/Settings.tsx', code);
