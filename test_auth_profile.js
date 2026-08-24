import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, "cakhiempn@gmail.com", "Password123!");
    const uid = auth.currentUser.uid;
    console.log("Logged in:", uid);

    // Create a dummy large string
    const largeString = "data:image/jpeg;base64," + "A".repeat(10000);
    await updateProfile(auth.currentUser, { photoURL: largeString });
    console.log("Update auth profile succeeded!");
    process.exit(0);
  } catch(e) {
    console.error("Update auth profile failed:", e);
    process.exit(1);
  }
}
run();
