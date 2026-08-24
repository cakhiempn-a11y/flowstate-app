import re

with open('src/pages/Login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the catch block for Google Auth
old_catch = """    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError(`Error: ${err.code} - ${err.message}`);
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(`Error: ${err.code} - ${err.message}`);
      } else if (err.code === 'auth/popup-blocked') {
        setError(t('auth.popupBlocked'));
      } else {
        setError(t('auth.unableToSignIn'));
      }
      setAuthLoading(false);
    }"""

new_catch = """    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Google Auth Error:", err);
      
      const isDevOrPreview = window.location.hostname.includes('run.app') || window.location.hostname === 'localhost';
      const isVercel = window.location.hostname.includes('vercel.app');
      
      // Temporary diagnostic logging
      if (isDevOrPreview || isVercel) {
        const errorDetails = `[DIAGNOSTIC] code: ${err.code}, message: ${err.message}, host: ${window.location.hostname}`;
        console.warn(errorDetails);
        if (err.code === 'auth/unauthorized-domain') {
           setError(`Setup Required: The domain ${window.location.hostname} is not authorized in Firebase. Please add it to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
           setAuthLoading(false);
           return;
        }
      }

      if (err.code === 'auth/popup-closed-by-user') {
        setError(t('auth.googleSignInFailed') + (isDevOrPreview ? ' (Popup closed)' : ''));
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(t('auth.googleSignInFailed') + (isDevOrPreview ? ' (Unauthorized domain)' : ''));
      } else if (err.code === 'auth/popup-blocked') {
        setError(t('auth.popupBlocked'));
      } else {
        setError(t('auth.unableToSignIn') + (isDevOrPreview ? ` (${err.code})` : ''));
      }
      setAuthLoading(false);
    }"""

if "auth.unableToSignIn" in content:
    content = content.replace(old_catch, new_catch)
else:
    print("Could not find catch block")

with open('src/pages/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched Login.tsx")
