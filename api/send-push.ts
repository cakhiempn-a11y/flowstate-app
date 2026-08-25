import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountStr) {
      const sa = JSON.parse(serviceAccountStr);
      admin.initializeApp({
        credential: admin.credential.cert(sa)
      });
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT not set');
    }
  } catch (err) {
    console.error('Firebase admin init error', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { token, title, body } = req.body;
  if (!token) return res.status(400).send('Token required');
  
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin not initialized. Check server env vars.' });
  }

  try {
    const response = await admin.messaging().send({
      token,
      data: {
        title: title || 'FlowState',
        body: body || 'Test notification',
        url: '/'
      }
    });
    return res.status(200).json({ success: true, messageId: response });
  } catch (error: any) {
    console.error('Error sending push', error);
    return res.status(500).json({ error: error.message });
  }
}
