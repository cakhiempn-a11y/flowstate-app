import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

async function run() {
  try {
    const email = "test" + Date.now() + "@example.com";
    await import("firebase/auth").then(m => m.createUserWithEmailAndPassword(auth, email, "Password123!"));

    try {
        await updateProfile(auth.currentUser, { displayName: "" });
        console.log("Firebase Auth updateProfile with empty string succeeded.");
    } catch(e) {
        console.error("Firebase Auth updateProfile with empty string failed:", e.code || e.message);
    }
    
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
}
run();
