import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
const app = initializeApp({ projectId: 'test' });
console.log('getting storage...');
try {
  getStorage(app);
  console.log('success');
} catch (e) {
  console.log('error:', e.message);
}
