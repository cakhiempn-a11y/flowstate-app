const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

const oldReminderLogic = `      if (settings.notifications.taskReminders) {
        const reminderMins = settings.notifications.reminderTime || 5;
        
        for (const task of tasks) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || !task.reminderEnabled || !task.startTime || !task.date) continue;
           
           if (task.date !== localDateStr && task.date !== tomorrowStr) continue;
           
           try {
             const taskStartUTC = fromZonedTime(\`\${task.date}T\${task.startTime}:00\`, tz);
             const diffMs = taskStartUTC.getTime() - now.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             // If difference is exactly 0, or up to reminderMins
             if (diffMins >= 0 && diffMins <= reminderMins) {
                const eventId = \`reminder_\${task.id}_\${task.date}_\${task.startTime}\`;
                await sendUserPush(eventId, 'FlowState', \`Công việc sắp bắt đầu: \${task.title}\`, '/tasks');
             }
           } catch (e) {
           }
        }
      }`;

const newReminderLogic = `      if (settings.notifications.taskReminders) {
        const reminderMins = settings.notifications.reminderTime || 5;
        let evaluated = 0;
        let selected = 0;
        
        for (const task of tasks) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || !task.startTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) continue;
           
           evaluated++;
           
           if (!task.reminderEnabled) {
              logs.push(\`Task \${task.id} (\${task.title}): skipped, reminderEnabled is false\`);
              continue;
           }
           
           try {
             const taskStartUTC = fromZonedTime(\`\${task.date}T\${task.startTime}:00\`, tz);
             const diffMs = taskStartUTC.getTime() - now.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             // Check if it falls in the window. We allow a slightly larger window for the 5-min cron
             // e.g. if diffMins is between 0 and reminderMins + 5
             if (diffMins >= 0 && diffMins <= reminderMins + 5) {
                const eventId = \`reminder_\${task.id}_\${task.date}_\${task.startTime}\`;
                const sent = await sendUserPush(eventId, 'FlowState', \`Công việc sắp bắt đầu: \${task.title}\`, '/tasks');
                if (sent) selected++;
                logs.push(\`Task \${task.id} (\${task.title}): reminderTime=\${formatInTimeZone(taskStartUTC, tz, 'HH:mm')}, now=\${formatInTimeZone(now, tz, 'HH:mm')}, diffMins=\${diffMins}, selected=true\`);
             } else {
                logs.push(\`Task \${task.id} (\${task.title}): diffMins=\${diffMins} outside window (0 to \${reminderMins + 5}), selected=false\`);
             }
           } catch (e: any) {
             logs.push(\`Task \${task.id} (\${task.title}): Error parsing time: \${e.message}\`);
           }
        }
        logs.push(\`TaskReminders: Evaluated \${evaluated}, Selected \${selected} (reminderMins=\${reminderMins})\`);
      }`;

code = code.replace(oldReminderLogic, newReminderLogic);

const oldSendUserPush = `      const sendUserPush = async (eventId: string, title: string, body: string, url: string) => {
         const eventRef = db.doc(\`users/\${userDoc.id}/notificationEvents/\${eventId}\`);
         const eventDoc = await eventRef.get();
         if (eventDoc.exists) return;

         let success = false;`;

const newSendUserPush = `      const sendUserPush = async (eventId: string, title: string, body: string, url: string) => {
         const eventRef = db.doc(\`users/\${userDoc.id}/notificationEvents/\${eventId}\`);
         const eventDoc = await eventRef.get();
         if (eventDoc.exists) return false;

         let success = false;`;

const oldSuccess = `         if (success) {
           await eventRef.set({ sentAt: new Date().toISOString() });
           sentCount++;
           logs.push(\`Sent \${eventId} to user \${userDoc.id}\`);
         }
      };`;
const newSuccess = `         if (success) {
           await eventRef.set({ sentAt: new Date().toISOString() });
           sentCount++;
           logs.push(\`Sent \${eventId} to user \${userDoc.id}\`);
         }
         return success;
      };`;

code = code.replace(oldSendUserPush, newSendUserPush).replace(oldSuccess, newSuccess);

fs.writeFileSync('api/process-notifications.ts', code);
