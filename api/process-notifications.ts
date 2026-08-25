import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const CRON_SECRET = process.env.CRON_SECRET || 'flowstate-cron-secure-token-8f92a';
const DB_ID = 'ai-studio-remixproductivit-924ecc80-7397-459a-a1d5-518a5f1b7dbc';
let initError: string | null = null;

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
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
       initError = 'Service account JSON is missing required fields';
       return null;
    }

    sa.private_key = sa.private_key.replace(/\\n/g, '\n');

    const app = initializeApp({
      credential: cert(sa)
    });

    initError = null;
    return app;
  } catch (err: any) {
    initError = `Firebase Admin Init Error: ${err.message}`;
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const providedSecret = req.headers.authorization?.replace('Bearer ', '') || req.query.cronSecret;
  if (providedSecret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid cronSecret' });
  }

  const app = getAdminApp();
  if (!app) {
    return res.status(500).json({
      error: initError || 'Firebase Admin not initialized.',
      stage: 'admin-init'
    });
  }

  // Ensure we connect to the specific named database used by this applet
  const db = getFirestore(app, DB_ID);
  const messaging = getMessaging(app);
  
  const testNowStr = req.query.testNow as string;
  const now = testNowStr ? new Date(testNowStr) : new Date();

  const logs: string[] = [];
  let processedUsers = 0;
  let sentCount = 0;

  try {
    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const settings = userData.settings;
      if (!settings || !settings.notifications) continue;

      const tz = settings.timezone || 'UTC';
      
      const devicesSnap = await db.collection(`users/${userDoc.id}/devices`).get();
      if (devicesSnap.empty) continue;
      
      const tokens = devicesSnap.docs.map(d => ({ id: d.id, token: d.data().token }));
      processedUsers++;

      const sendUserPush = async (eventId: string, title: string, body: string, url: string) => {
         const eventRef = db.doc(`users/${userDoc.id}/notificationEvents/${eventId}`);
         const eventDoc = await eventRef.get();
         if (eventDoc.exists) return false;

         let success = false;
         for (const d of tokens) {
           try {
             await messaging.send({
               token: d.token,
               data: { title, body, url }
             });
             success = true;
           } catch (error: any) {
             const code = error.code || 'unknown';
             if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
                await db.doc(`users/${userDoc.id}/devices/${d.id}`).delete();
                logs.push(`Removed invalid token ${d.id} for user ${userDoc.id}`);
             } else {
                logs.push(`Error sending to ${d.id}: ${error.message}`);
             }
           }
         }
         
         if (success) {
           await eventRef.set({ sentAt: new Date().toISOString() });
           sentCount++;
           logs.push(`Sent ${eventId} to user ${userDoc.id}`);
         }
         return success;
      };

      const tasksSnap = await db.collection(`users/${userDoc.id}/tasks`).get();
      const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const localDateStr = formatInTimeZone(now, tz, 'yyyy-MM-dd');
      const localTimeStr = formatInTimeZone(now, tz, 'HH:mm');
      const tomorrowStr = formatInTimeZone(new Date(now.getTime() + 86400000), tz, 'yyyy-MM-dd');

      if (settings.notifications.taskReminders) {
        const reminderMins = settings.notifications.reminderTime || 5;
        let evaluated = 0;
        let selected = 0;
        let remindersDue = 0;
        
        for (const task of tasks as any[]) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || !task.startTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) continue;
           
           evaluated++;
           
           if (!task.reminderEnabled) {
              logs.push(`Task ${task.id}: skipped (reminderEnabled false)`);
              continue;
           }
           
           try {
             const taskStartUTC = fromZonedTime(`${task.date}T${task.startTime}:00`, tz);
             const reminderTimeUTC = new Date(taskStartUTC.getTime() - reminderMins * 60000);
             
             const diffMs = now.getTime() - reminderTimeUTC.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             // If now is >= reminder time, and it's been less than 60 minutes since the reminder time.
             // This gives a safe window for the scheduler to catch up.
             if (diffMins >= 0 && diffMins <= 60) {
                remindersDue++;
                const eventId = `reminder_${task.id}_${task.date}_${task.startTime}_${reminderMins}`;
                const sent = await sendUserPush(eventId, 'FlowState', `Công việc sắp bắt đầu: ${task.title}`, '/tasks');
                if (sent) selected++;
                logs.push(`Task ${task.id} (${task.title}): reminderTime=${formatInTimeZone(reminderTimeUTC, tz, 'HH:mm')}, diffMins=${diffMins}, sent=${sent}`);
             } else {
                logs.push(`Task ${task.id} (${task.title}): skipped, reminderTime=${formatInTimeZone(reminderTimeUTC, tz, 'HH:mm')}, diffMins=${diffMins} outside window (0-60)`);
             }
           } catch (e: any) {
             logs.push(`Task ${task.id}: Error parsing time ${e.message}`);
           }
        }
        logs.push(`TaskReminders: Evaluated ${evaluated}, Due ${remindersDue}, Selected ${selected}`);
      }

      if (settings.notifications.overdueAlerts) {
         let overdueEvaluated = 0;
         let overdueDue = 0;
         let overdueSent = 0;

         for (const task of tasks as any[]) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || task.status === 'Skipped' || !task.endTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) {
               // Only check tasks from today or yesterday to prevent massive historical queries
               const yesterdayStr = formatInTimeZone(new Date(now.getTime() - 86400000), tz, 'yyyy-MM-dd');
               if (task.date !== yesterdayStr) continue;
           }

           overdueEvaluated++;
           
           try {
             const taskEndUTC = fromZonedTime(`${task.date}T${task.endTime}:00`, tz);
             const diffMs = now.getTime() - taskEndUTC.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             // If now is > end time, and less than 24 hours have passed
             if (diffMins >= 0 && diffMins <= 1440) {
                overdueDue++;
                const eventId = `overdue_${task.id}_${task.date}_${task.endTime}`;
                const sent = await sendUserPush(eventId, 'FlowState', `Công việc đã quá hạn: ${task.title}`, '/tasks');
                if (sent) overdueSent++;
                logs.push(`Task ${task.id} (${task.title}): overdue by ${diffMins}m, sent=${sent}`);
             }
           } catch(e) {
           }
         }
         logs.push(`OverdueAlerts: Evaluated ${overdueEvaluated}, Due ${overdueDue}, Sent ${overdueSent}`);
      }

      if (settings.notifications.dailySummary) {
         const summaryTime = settings.notifications.dailySummaryTime || '07:00';
         
         let summaryEvaluated = 1;
         let summarySent = 0;
         
         // Only send if we are within 2 hours of the summary time to prevent late-day sends if the cron was completely down
         // but normally it will trigger precisely when localTimeStr >= summaryTime
         
         const [sHour, sMin] = summaryTime.split(':').map(Number);
         const summaryTimeUTC = fromZonedTime(`${localDateStr}T${summaryTime}:00`, tz);
         
         const diffMins = Math.floor((now.getTime() - summaryTimeUTC.getTime()) / 60000);
         
         if (diffMins >= 0 && diffMins <= 120) {
            const eventId = `summary_${localDateStr}_${summaryTime}`;
            const sent = await sendUserPush(eventId, 'FlowState', `Lịch hôm nay: ${tasks.filter((t: any) => t.date === localDateStr).length} công việc`, '/calendar');
            if (sent) summarySent++;
         } else {
            logs.push(`Summary skipped: diffMins=${diffMins} outside window`);
         }
         logs.push(`DailySummary: Evaluated ${summaryEvaluated}, Sent ${summarySent}`);
      }
    }

    return res.status(200).json({ success: true, processedUsers, sentCount, logs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, logs });
  }
}
