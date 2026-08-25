const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

// Replace users query
let target = `    stage = 'users-query';
    const usersSnap = await db.collection('users').get();
    
    for (const userDoc of usersSnap.docs) {`;

let replacement = `    stage = 'users-query';
    console.log('[process-notifications] usersQueryStarted');
    const usersSnap = await db.collection('users').get();
    console.log('[process-notifications] usersQuerySucceeded, usersCount=', usersSnap.docs.length);
    
    for (const userDoc of usersSnap.docs) {`;

code = code.replace(target, replacement);

// Replace fcm send
target = `         for (const d of tokens) {
           stage = 'fcm-send';
           try {
             await messaging.send({
               token: d.token,
               data: { title, body, url }
             });
             success = true;
           } catch (error: any) {`;

replacement = `         for (const d of tokens) {
           stage = 'fcm-send';
           console.log(\`[process-notifications] fcmSendStarted for token length \${d.token.length}\`);
           try {
             await messaging.send({
               token: d.token,
               data: { title, body, url }
             });
             success = true;
             console.log('[process-notifications] fcmSendSucceeded');
           } catch (error: any) {`;

code = code.replace(target, replacement);

// Admin init logs
target = `    stage = 'firestore-init';
    const db = getFirestore(app, DB_ID);
    const messaging = getMessaging(app);`;

replacement = `    console.log('[process-notifications] firebaseAdminInitialized: true');
    console.log('[process-notifications] firestoreDatabase: ' + DB_ID);
    stage = 'firestore-init';
    const db = getFirestore(app, DB_ID);
    const messaging = getMessaging(app);`;

code = code.replace(target, replacement);

fs.writeFileSync('api/process-notifications.ts', code);
console.log("Patched more logs");
