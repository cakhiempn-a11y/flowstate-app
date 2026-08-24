import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const email = "test" + Date.now() + "@example.com";
    await createUserWithEmailAndPassword(auth, email, "Password123!");
    console.log('Created User UID:', auth.currentUser.uid);

    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid);

    try {
        await setDoc(docRef, {
            uid: uid,
            email: email
        }, { merge: true });
        console.log("Firestore initial save succeeded.");
    } catch(e) {
        console.error("Firestore initial save failed:", e.code || e.message);
    }

    try {
        await updateProfile(auth.currentUser, { displayName: "Test User" });
        console.log("Firebase Auth updateProfile succeeded.");
    } catch(e) {
        console.error("Firebase Auth updateProfile failed:", e.code || e.message);
    }

    try {
        await setDoc(docRef, {
            displayName: "Test User",
            birthYear: "2005",
            gender: "Male",
            occupation: "Developer"
        }, { merge: true });
        console.log("Firestore merge succeeded.");
    } catch(e) {
        console.error("Firestore merge failed:", e.code || e.message);
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e.code || e.message);
    process.exit(1);
  }
}

run();
