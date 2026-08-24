import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    console.log('Signing in...');
    await signInWithEmailAndPassword(auth, "cakhiempn@gmail.com", "password123");
    console.log('User UID:', auth.currentUser.uid);

    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid);

    console.log('Testing create/update...');
    await setDoc(docRef, {
      displayName: 'Test User',
      birthYear: '2005',
      gender: 'Male',
      occupation: 'Developer'
    }, { merge: true });
    console.log('Successfully saved profile!');

    const snap = await getDoc(docRef);
    console.log('Read data:', snap.data());
    
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  }
}

run();
