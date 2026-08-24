import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, "cakhiempn@gmail.com", "Password123!");
    console.log('User UID:', auth.currentUser.uid);

    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid);

    try {
        await updateProfile(auth.currentUser, { displayName: "Test User" });
        console.log("Firebase Auth updateProfile succeeded.");
    } catch(e) {
        console.error("Firebase Auth updateProfile failed:", e);
    }

    try {
        await setDoc(docRef, {
            displayName: "Test User",
            birthYear: "2005",
            gender: "Male",
            occupation: "Developer"
        }, { merge: true });
        console.log("Firestore update succeeded.");
    } catch(e) {
        console.error("Firestore update failed:", e);
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  }
}

run();
