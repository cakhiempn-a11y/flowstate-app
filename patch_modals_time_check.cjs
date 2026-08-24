const fs = require('fs');

function patchTimeCheck(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  const origCheck = "const bufferTime = new Date(now.getTime() - 5 * 60000);\n        if (selectedTime < bufferTime) {";
  const origCheckAlt = "const bufferTime = new Date(now.getTime() - 5 * 60000);\n      if (selectedTime < bufferTime) {";
        
  let newCheck;
  if (file.includes('TaskModal')) {
    newCheck = "const isTimeChanged = !existingTask || existingTask.date !== formData.date || existingTask.startTime !== formData.startTime;\n        const bufferTime = new Date(now.getTime() - 5 * 60000);\n        if (isTimeChanged && selectedTime < bufferTime) {";
  } else if (file.includes('ScheduleModal')) {
    newCheck = "const isTimeChanged = task.date !== date || task.startTime !== startTime;\n      const bufferTime = new Date(now.getTime() - 5 * 60000);\n      if (isTimeChanged && selectedTime < bufferTime) {";
  }

  if (code.includes(origCheck)) {
    code = code.replace(origCheck, newCheck);
    fs.writeFileSync(file, code);
    console.log('Patched time check in', file);
  } else if (code.includes(origCheckAlt)) {
    code = code.replace(origCheckAlt, newCheck);
    fs.writeFileSync(file, code);
    console.log('Patched time check (alt) in', file);
  } else {
    console.log('Could not find origCheck in', file);
  }
}

patchTimeCheck('src/components/TaskModal.tsx');
patchTimeCheck('src/components/ScheduleModal.tsx');
