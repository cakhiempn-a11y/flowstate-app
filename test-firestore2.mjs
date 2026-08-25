import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  projectId: 'test-project'
});

try {
  const db = getFirestore(app, 'ai-studio-remixproductivit-924ecc80-7397-459a-a1d5-518a5f1b7dbc');
  console.log('Success!');
} catch (e) {
  console.error('Error:', e.message);
}
