const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleModal.tsx', 'utf8');

if (!code.includes('const [error, setError]')) {
  code = code.replace(
    'const [endTime, setEndTime] = useState(\'\');',
    'const [endTime, setEndTime] = useState(\'\');\n  const [error, setError] = useState<string | null>(null);'
  );
}

const handleSaveOriginal = `  const handleSave = () => {
    if (!date || !startTime || !endTime) return;

    updateTask(task.id, {`;
    
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
      
      const bufferTime = new Date(now.getTime() - 5 * 60000);
      if (selectedTime < bufferTime) {
        setError(t('validation.startTimePastError') || 'Start time must be now or later.');
        return;
      }
    }

    updateTask(task.id, {`;

if (code.includes('  const handleSave = () => {\n    if (!date || !startTime || !endTime) return;\n\n    updateTask(task.id, {')) {
    code = code.replace(handleSaveOriginal, handleSaveNew);
}

// Add imports
if (!code.includes('startOfDay')) {
    code = code.replace(
        "import { format, parseISO",
        "import { format, parseISO, startOfDay, isSameDay"
    );
}
// Maybe the import doesn't have parseISO? Let's check imports
