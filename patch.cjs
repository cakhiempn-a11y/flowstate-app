const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const oldCode = `        setStatusMsg('Registering Service Worker...');
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
        });`;

const newCode = `        setStatusMsg('Registering Service Worker...');
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
           registration = await navigator.serviceWorker.register('/sw.js');
        }
        
        setStatusMsg('Waiting for Service Worker to become ready...');
        registration = await navigator.serviceWorker.ready;

        setStatusMsg('Getting FCM token...');
        const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
        if (!vapidKey) {
          throw new Error("VAPID Key is missing in environment variables.");
        }

        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });`;

code = code.replace(oldCode, newCode);

const oldCatch = `    } catch (e: any) {
      console.error('Notification Setup Error:', e);
      setErrorMsg(e.message || "An unknown error occurred.");
      setStatusMsg('');
    }`;

const newCatch = `    } catch (e: any) {
      console.error('Notification Setup Error:', e);
      // Detailed error for desktop diagnostics
      setErrorMsg(e.code ? \`\${e.code}: \${e.message}\` : (e.message || "An unknown error occurred."));
      setStatusMsg('');
    }`;

code = code.replace(oldCatch, newCatch);

fs.writeFileSync('src/pages/Settings.tsx', code);
