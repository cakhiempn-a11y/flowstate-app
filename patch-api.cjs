const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

// First, modify the initialization and metrics setup at the beginning of the handler
const metricsSetupOld = `  const logs: string[] = [];
  let processedUsers = 0;
  let sentCount = 0;`;

const metricsSetupNew = `  const startMs = Date.now();
  const logs: string[] = [];
  let processedUsers = 0;
  let sentCount = 0;
  let tasksEvaluated = 0;
  let remindersEvaluated = 0;
  let remindersDue = 0;
  let overdueEvaluated = 0;
  let overdueDue = 0;
  let dailySummariesEvaluated = 0;
  let skippedCount = 0;`;

code = code.replace(metricsSetupOld, metricsSetupNew);

// Replace TaskReminder logic variables mapping
code = code.replace(/let evaluated = 0;/g, "");
code = code.replace(/evaluated\+\+;/g, "tasksEvaluated++; remindersEvaluated++;");
code = code.replace(/logs\.push\(\`TaskReminders: Evaluated \$\{evaluated\}, Due \$\{remindersDue\}, Selected \$\{selected\}\`\);/g, "logs.push(\`TaskReminders: Evaluated \${remindersEvaluated}, Due \${remindersDue}, Selected \${selected}\`);");

// Replace OverdueAlert logic variables mapping
code = code.replace(/let overdueEvaluated = 0;/g, "");
code = code.replace(/logs\.push\(\`OverdueAlerts: Evaluated \$\{overdueEvaluated\}, Due \$\{overdueDue\}, Sent \$\{overdueSent\}\`\);/g, "logs.push(\`OverdueAlerts: Evaluated \${overdueEvaluated}, Due \${overdueDue}, Sent \${overdueSent}\`);");
code = code.replace(/overdueEvaluated\+\+;/g, "tasksEvaluated++; overdueEvaluated++;");

// Replace Summary logic variables mapping
code = code.replace(/let summaryEvaluated = 1;/g, "dailySummariesEvaluated++;");
code = code.replace(/logs\.push\(\`DailySummary: Evaluated \$\{summaryEvaluated\}, Sent \$\{summarySent\}\`\);/g, "logs.push(\`DailySummary: Evaluated 1, Sent \${summarySent}\`);");

// Modify final response
const returnOld = `    return res.status(200).json({ success: true, processedUsers, sentCount, logs });`;
const returnNew = `    const executionDurationMs = Date.now() - startMs;
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
    });`;
code = code.replace(returnOld, returnNew);

// Replace skipped logic to count skippedCount
code = code.replace(/logs\.push\(\`Task \$\{task\.id\}: skipped \(reminderEnabled false\)\`\);/g, "skippedCount++; logs.push(\`Task \${task.id}: skipped (reminderEnabled false)\`);");
code = code.replace(/logs\.push\(\`Task \$\{task\.id\} \(\$\{task\.title\}\): skipped, reminderTime=\$\{formatInTimeZone\(reminderTimeUTC, tz, 'HH:mm'\)\}, diffMins=\$\{diffMins\} outside window \(0-60\)\`\);/g, "skippedCount++; logs.push(\`Task \${task.id} (\${task.title}): skipped, reminderTime=\${formatInTimeZone(reminderTimeUTC, tz, 'HH:mm')}, diffMins=\${diffMins} outside window (0-60)\`);");
code = code.replace(/logs\.push\(\`Summary skipped: diffMins=\$\{diffMins\} outside window\`\);/g, "skippedCount++; logs.push(\`Summary skipped: diffMins=\${diffMins} outside window\`);");


fs.writeFileSync('api/process-notifications.ts', code);
console.log("Patched process-notifications.ts");
