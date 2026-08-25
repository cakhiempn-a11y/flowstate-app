import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  project_id: "test-project",
  private_key: "-----BEGIN PRIVATE KEY-----\nFakeKey\n-----END PRIVATE KEY-----\n",
  client_email: "test@test-project.iam.gserviceaccount.com"
};

const app = initializeApp({
  credential: cert(serviceAccount)
});

try {
  const db = getFirestore(app, 'ai-studio-remixproductivit-924ecc80-7397-459a-a1d5-518a5f1b7dbc');
  console.log('Success!');
} catch (e) {
  console.error('Error:', e.message);
}
