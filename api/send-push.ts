import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

let initError: string | null = null;

function getAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountStr) {
      initError = 'FIREBASE_SERVICE_ACCOUNT env var is missing';
      return null;
    }

    let sa: any;
    try {
      sa = JSON.parse(serviceAccountStr);
    } catch (e: any) {
      initError = `Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${e.message}`;
      return null;
    }

    if (!sa.project_id || !sa.private_key || !sa.client_email) {
       initError = 'Service account JSON is missing required fields (project_id, private_key, client_email)';
       return null;
    }

    // Fix Vercel newline escaping issues in private key
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert(sa)
    });

    initError = null;
    return admin;
  } catch (err: any) {
    initError = `Firebase Admin Init Error: ${err.message}`;
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add basic CORS headers for safety
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { token, title, body } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required', stage: 'request-validation' });

  const adminInstance = getAdmin();
  if (!adminInstance) {
    return res.status(500).json({
      error: initError || 'Firebase Admin not initialized.',
      stage: 'admin-init'
    });
  }

  try {
    const response = await adminInstance.messaging().send({
      token,
      data: {
        title: title || 'FlowState',
        body: body || 'Test notification',
        url: '/'
      }
    });
    return res.status(200).json({ success: true, messageId: response, stage: 'fcm-send' });
  } catch (error: any) {
    console.error('Error sending push', error);

    // Handle specific Firebase errors
    const errorCode = error.code || 'unknown';
    const errorMessage = error.message || String(error);

    // If the token is invalid or unregistered
    if (errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered') {
      return res.status(400).json({
        error: 'The device token is invalid or no longer registered.',
        code: errorCode,
        stage: 'fcm-send'
      });
    }

    return res.status(500).json({
      error: errorMessage,
      code: errorCode,
      stage: 'fcm-send'
    });
  }
}
