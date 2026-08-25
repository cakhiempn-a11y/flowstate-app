const fs = require('fs');

let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// Replace handleGoogleAuth
const newGoogleAuth = `  const handleGoogleAuth = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Success is naturally handled by onAuthStateChanged in AuthContext
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      
      const isDevOrPreview = window.location.hostname.includes('run.app') || window.location.hostname === 'localhost';
      
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError(t('auth.googleSignInFailed') + (isDevOrPreview ? ' (Popup closed)' : ''));
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(t('auth.googleSignInFailed') + (isDevOrPreview ? ' (Unauthorized domain)' : ''));
      } else if (err.code === 'auth/popup-blocked') {
        setError(t('auth.popupBlocked') || 'Popup blocked by browser. Please allow popups for this site.');
      } else {
        setError(t('auth.unableToSignIn') + (isDevOrPreview ? \` (\${err.code})\` : ''));
      }
      setAuthLoading(false);
    }
  };`;

// Use regex to replace the old handleGoogleAuth function.
// Since the function might have varying contents, we replace from "const handleGoogleAuth = async () => {"
// to the end of the function.
const startIdx = code.indexOf('  const handleGoogleAuth = async () => {');
if (startIdx !== -1) {
  // Find the end of the function: "  };\n"
  const endIdx = code.indexOf('  };\n', startIdx);
  if (endIdx !== -1) {
    code = code.substring(0, startIdx) + newGoogleAuth + code.substring(endIdx + 4);
  } else {
    console.error("Could not find end of handleGoogleAuth");
  }
} else {
  console.error("Could not find start of handleGoogleAuth");
}

// Remove the TEMPORARY DIAGNOSTICS block
const diagStart = code.indexOf('{/* TEMPORARY DIAGNOSTICS */}');
if (diagStart !== -1) {
  const diagEnd = code.indexOf('</div>', diagStart);
  if (diagEnd !== -1) {
    // There might be another </div> or just the first closing one for the inner div.
    // The diag block we injected is exactly:
    // {/* TEMPORARY DIAGNOSTICS */}
    // <div className="w-full max-w-md mx-auto mb-4 p-4 bg-black text-lime-400 text-xs font-mono rounded overflow-auto">
    // ...
    // </div>
    // So finding the first </div> after diagStart is enough.
    code = code.substring(0, diagStart) + code.substring(diagEnd + 6);
  }
}

// Also remove `import firebaseConfig from '../../firebase-applet-config.json';`
code = code.replace("import firebaseConfig from '../../firebase-applet-config.json';\n", "");

fs.writeFileSync('src/pages/Login.tsx', code);
console.log("Updated Login.tsx");
