const fs = require('fs');
const code = fs.readFileSync('/tmp/bundle.js', 'utf8');

// The bundle is minified. Let's find the useAuth provider.
const idx = code.indexOf('AuthContext.Provider');
if (idx !== -1) {
  console.log(code.substring(Math.max(0, idx - 500), idx + 100));
}
