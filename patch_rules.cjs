const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const deviceRule = `
      // Action: Manage Devices
      match /devices/{deviceId} {
        allow read, write: if isSignedIn() && request.auth.uid == userId;
      }
`;

code = code.replace(/match \/users\/\{userId\} \{/, `match /users/{userId} {${deviceRule}`);
fs.writeFileSync('firestore.rules', code);
