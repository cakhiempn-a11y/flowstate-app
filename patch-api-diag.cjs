const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

const tryCatchReplacement = `
  const startMs = Date.now();
  const logs: string[] = [];
  let processedUsers = 0;
  let sentCount = 0;
  let tasksEvaluated = 0;
  let remindersEvaluated = 0;
  let remindersDue = 0;
  let overdueEvaluated = 0;
  let overdueDue = 0;
  let dailySummariesEvaluated = 0;
  let skippedCount = 0;
  let stage = 'init';

  try {
    stage = 'admin-init';
    const app = getAdminApp();
    if (!app) {
      return res.status(500).json({
        success: false,
        stage: 'admin-init',
        error: initError || 'Firebase Admin not initialized.'
      });
    }

    stage = 'firestore-init';
    const db = getFirestore(app, DB_ID);
    const messaging = getMessaging(app);
    
    stage = 'users-query';
    const usersSnap = await db.collection('users').get();
    
    for (const userDoc of usersSnap.docs) {
      stage = 'user-processing';
      const userData = userDoc.data();
      const settings = userData.settings;
      if (!settings || !settings.notifications) continue;
      const tz = settings.timezone || 'UTC';
      
      stage = 'devices-query';
      const devicesSnap = await db.collection(\`users/\${userDoc.id}/devices\`).get();
      if (devicesSnap.empty) continue;
      
      const tokens = devicesSnap.docs.map(d => ({ id: d.id, token: d.data().token }));
      processedUsers++;

      const sendUserPush = async (eventId: string, title: string, body: string, url: string) => {
         stage = 'notification-event-read';
         const eventRef = db.doc(\`users/\${userDoc.id}/notificationEvents/\${eventId}\`);
         const eventDoc = await eventRef.get();
         if (eventDoc.exists) return false;
         
         let success = false;
         for (const d of tokens) {
           stage = 'fcm-send';
           try {
             await messaging.send({
               token: d.token,
               data: { title, body, url }
             });
             success = true;
           } catch (error: any) {
             const code = error.code || 'unknown';
             if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
                stage = 'fcm-invalid-token-delete';
                await db.doc(\`users/\${userDoc.id}/devices/\${d.id}\`).delete();
                logs.push(\`Removed invalid token \${d.id} for user \${userDoc.id}\`);
             } else {
                logs.push(\`Error sending to \${d.id}: \${error.message}\`);
             }
           }
         }
         
         if (success) {
           stage = 'notification-event-write';
           await eventRef.set({ sentAt: new Date().toISOString() });
           sentCount++;
           logs.push(\`Sent \${eventId} to user \${userDoc.id}\`);
         }
         return success;
      };

      stage = 'tasks-query';
      const tasksSnap = await db.collection(\`users/\${userDoc.id}/tasks\`).get();
      const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      stage = 'timezone-processing';
      const localDateStr = formatInTimeZone(now, tz, 'yyyy-MM-dd');
      const localTimeStr = formatInTimeZone(now, tz, 'HH:mm');
      const tomorrowStr = formatInTimeZone(new Date(now.getTime() + 86400000), tz, 'yyyy-MM-dd');

      stage = 'task-reminders-eval';
      if (settings.notifications.taskReminders) {
        const reminderMins = settings.notifications.reminderTime || 5;
        let selected = 0;
        let remindersDueInner = 0;
        
        for (const task of tasks as any[]) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || !task.startTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) continue;
           
           tasksEvaluated++; remindersEvaluated++;
           
           if (!task.reminderEnabled) {
              skippedCount++;
              continue;
           }
           
           stage = 'task-reminders-timezone';
           try {
             const taskStartUTC = fromZonedTime(\`\${task.date}T\${task.startTime}:00\`, tz);
             const reminderTimeUTC = new Date(taskStartUTC.getTime() - reminderMins * 60000);
             
             const diffMs = now.getTime() - reminderTimeUTC.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             if (diffMins >= 0 && diffMins <= 60) {
                remindersDueInner++;
                remindersDue++;
                const eventId = \`reminder_\${task.id}_\${task.date}_\${task.startTime}_\${reminderMins}\`;
                stage = 'task-reminders-send';
                const sent = await sendUserPush(eventId, 'FlowState', \`Công việc sắp bắt đầu: \${task.title}\`, '/tasks');
                if (sent) selected++;
             } else {
                skippedCount++;
             }
           } catch (e: any) {
             logs.push(\`Task \${task.id}: Error parsing time \${e.message}\`);
           }
        }
      }

      stage = 'overdue-eval';
      if (settings.notifications.overdueAlerts) {
         let overdueDueInner = 0;
         let overdueSent = 0;

         for (const task of tasks as any[]) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || task.status === 'Skipped' || !task.endTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) {
               const yesterdayStr = formatInTimeZone(new Date(now.getTime() - 86400000), tz, 'yyyy-MM-dd');
               if (task.date !== yesterdayStr) continue;
           }

           tasksEvaluated++; overdueEvaluated++;
           
           stage = 'overdue-timezone';
           try {
             const taskEndUTC = fromZonedTime(\`\${task.date}T\${task.endTime}:00\`, tz);
             const diffMs = now.getTime() - taskEndUTC.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             if (diffMins >= 0 && diffMins <= 1440) {
                overdueDueInner++;
                overdueDue++;
                const eventId = \`overdue_\${task.id}_\${task.date}_\${task.endTime}\`;
                stage = 'overdue-send';
                const sent = await sendUserPush(eventId, 'FlowState', \`Công việc đã quá hạn: \${task.title}\`, '/tasks');
                if (sent) overdueSent++;
             }
           } catch(e) {
           }
         }
      }

      stage = 'daily-summary-eval';
      if (settings.notifications.dailySummary) {
         const summaryTime = settings.notifications.dailySummaryTime || '07:00';
         dailySummariesEvaluated++;
         let summarySent = 0;
         
         stage = 'daily-summary-timezone';
         const [sHour, sMin] = summaryTime.split(':').map(Number);
         const summaryTimeUTC = fromZonedTime(\`\${localDateStr}T\${summaryTime}:00\`, tz);
         
         const diffMins = Math.floor((now.getTime() - summaryTimeUTC.getTime()) / 60000);
         
         if (diffMins >= 0 && diffMins <= 120) {
            const eventId = \`summary_\${localDateStr}_\${summaryTime}\`;
            stage = 'daily-summary-send';
            const sent = await sendUserPush(eventId, 'FlowState', \`Lịch hôm nay: \${tasks.filter((t: any) => t.date === localDateStr).length} công việc\`, '/calendar');
            if (sent) summarySent++;
         } else {
            skippedCount++;
         }
      }
    }

    const executionDurationMs = Date.now() - startMs;
    return res.status(200).json({ 
      success: true, 
      processedUsers, 
      tasksEvaluated,
      remindersEvaluated,
      remindersDue,
      overdueEvaluated,
      overdueDue,
      dailySummariesEvaluated,
      sentCount,
      skippedCount,
      executionDurationMs,
      // logs 
    });
  } catch (err: any) {
    return res.status(500).json({ 
      success: false,
      stage,
      error: err.message,
      name: err.name,
      // stack: err.stack
    });
  }
`;

// Replace from "const app = getAdminApp();" to the end of the try/catch block
const startMatch = "const app = getAdminApp();";
const endMatch = "return res.status(500).json({ error: err.message, logs });\n  }\n}";

const startIndex = code.indexOf(startMatch);
const endIndex = code.indexOf(endMatch) + endMatch.length;

if (startIndex > -1 && endIndex > -1) {
    const beforeStr = code.substring(0, startIndex);
    
    // We also need to get the req parsing stuff that was right before the try block in the original.
    
    const newCode = beforeStr + tryCatchReplacement + "\n}\n";
    fs.writeFileSync('api/process-notifications.ts', newCode);
    console.log("Successfully patched api/process-notifications.ts");
} else {
    console.error("Could not find replacement bounds");
}

