import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getStorage, ref, uploadString } from "firebase/storage";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const storage = getStorage(app);

async function run() {
  try {
    const email = "test" + Date.now() + "@example.com";
    await createUserWithEmailAndPassword(auth, email, "Password123!");
    const uid = auth.currentUser.uid;
    console.log("Logged in:", uid);

    const avatarRef = ref(storage, `users/${uid}/profile/avatar.jpg`);
    console.log("Uploading to", avatarRef.fullPath);
    await uploadString(avatarRef, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD', 'data_url');
    console.log("Upload succeeded!");
    process.exit(0);
  } catch(e) {
    console.error("Upload failed:");
    console.error(e);
    if (e.customData && e.customData.serverResponse) {
        console.error("Server response:", e.customData.serverResponse);
    }
    process.exit(1);
  }
}
run();
