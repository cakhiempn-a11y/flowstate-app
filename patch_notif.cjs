const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const notifLogic = `
  const [permission, setPermission] = useState(Notification.permission);
  const [tokenStr, setTokenStr] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        const { getMessagingInstance } = await import('../firebase');
        const { getToken } = await import('firebase/messaging');
        const messaging = await getMessagingInstance();
        if (messaging) {
          const registration = await navigator.serviceWorker.ready;
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FCM_VAPID_KEY || 'BEDr5Xl02nK3v_Px_XvEpDQBPcEq1_oRxlTwUhuJOIl_77WM2zGdLKIZbbTp_9ss_FpxvHgPllsTspfq8f5-Qik',
            serviceWorkerRegistration: registration
          });
          if (token) {
            setTokenStr(token);
            const { saveDeviceToken } = await import('../firebaseHelpers');
            await saveDeviceToken(token, 'web');
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRequesting(false);
    }
  };

  const sendTestNotification = async () => {
    if (!tokenStr) return;
    try {
      await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenStr, title: 'FlowState', body: 'Thông báo thử nghiệm' })
      });
    } catch (e) {
      console.error(e);
    }
  };
`;

code = code.replace(
  'function NotificationSettings({ settings, updateSettings, t }: any) {',
  `function NotificationSettings({ settings, updateSettings, t }: any) {${notifLogic}`
);

const uiCode = `
        <h2 className="text-lg font-bold text-foreground mb-4">{t('settings.notifications') || 'Notifications'}</h2>
        
        <div className="mb-6 p-4 border border-border rounded-xl bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-foreground text-sm">System Notifications</div>
              <div className="text-xs text-muted-foreground mt-1">
                {permission === 'granted' ? 'Notifications enabled for this device.' : 'Allow FlowState to send push notifications.'}
              </div>
            </div>
            {permission === 'granted' ? (
              <div className="flex items-center space-x-2 text-sm text-green-600 font-bold">
                <CheckSquare className="w-5 h-5" /> <span>Enabled</span>
              </div>
            ) : (
              <button 
                onClick={requestPermission} 
                disabled={isRequesting}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90"
              >
                {isRequesting ? 'Requesting...' : 'Enable Notifications'}
              </button>
            )}
          </div>
          {permission === 'granted' && tokenStr && (
            <button 
              onClick={sendTestNotification} 
              className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/80 w-full"
            >
              Send Test Notification
            </button>
          )}
        </div>
`;

code = code.replace(
  `<h2 className="text-lg font-bold text-foreground mb-4">{t('settings.notifications') || 'Notifications'}</h2>`,
  uiCode
);

fs.writeFileSync('src/pages/Settings.tsx', code);
