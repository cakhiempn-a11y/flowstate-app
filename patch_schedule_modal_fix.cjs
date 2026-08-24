const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleModal.tsx', 'utf8');

const handleSaveOriginal = "  const handleSave = () => {\n    if (!date || !startTime || !endTime) return;\n    updateTask(task.id, {";

const handleSaveNew = `  const handleSave = () => {
    if (!date || !startTime || !endTime) return;
    setError(null);

    const scheduledDate = startOfDay(parseISO(date));
    const today = startOfDay(new Date());

    if (scheduledDate < today) {
      setError(t('validation.schedulePastError') || 'Scheduled date must be today or later.');
      return;
    }
    
    if (task.deadline) {
      const deadlineDate = startOfDay(parseISO(task.deadline));
      if (scheduledDate > deadlineDate) {
        setError(t('validation.scheduleAfterDueError') || 'Scheduled date must be between today and the due date.');
        return;
      }
    }
    
    if (isSameDay(scheduledDate, today) && startTime) {
      const now = new Date();
      const [h, m] = startTime.split(':').map(Number);
      const selectedTime = new Date(today);
      selectedTime.setHours(h, m, 0, 0);
      
      const isTimeChanged = task.date !== date || task.startTime !== startTime;
      const bufferTime = new Date(now.getTime() - 5 * 60000);
      if (isTimeChanged && selectedTime < bufferTime) {
        setError(t('validation.startTimePastError') || 'Start time must be now or later.');
        return;
      }
    }

    updateTask(task.id, {`;

if (code.includes(handleSaveOriginal)) {
    code = code.replace(handleSaveOriginal, handleSaveNew);
    fs.writeFileSync('src/components/ScheduleModal.tsx', code);
    console.log('Fixed handleSave in ScheduleModal');
} else {
    console.log('Could not find handleSaveOriginal in ScheduleModal');
}
