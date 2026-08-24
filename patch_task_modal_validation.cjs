const fs = require('fs');
let code = fs.readFileSync('src/components/TaskModal.tsx', 'utf8');

// 1. Add error state
if (!code.includes('const [error, setError]')) {
  code = code.replace(
    'const [showDeleteScope, setShowDeleteScope] = useState(false);',
    'const [showDeleteScope, setShowDeleteScope] = useState(false);\n  const [error, setError] = useState<string | null>(null);'
  );
}

// 2. Clear error when modal opens
code = code.replace(
  'const { t, language } = useTranslation();',
  'const { t, language } = useTranslation();\n  useEffect(() => { if (isOpen) setError(null); }, [isOpen]);'
);

// 3. Render error
if (!code.includes('{error && (')) {
  code = code.replace(
    '{conflictingTask && (',
    '{error && (\n            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-semibold">\n              {error}\n            </div>\n          )}\n          {conflictingTask && ('
  );
}

// 4. Update save validation
const handleSaveOriginal = `  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // If it's modifying a recurring task`;

const handleSaveNew = `  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    
    const today = startOfDay(new Date());
    
    // Deadline validation
    if (formData.deadline) {
      const deadlineDate = startOfDay(parseISO(formData.deadline));
      const isNewTask = !existingTask;
      const isDeadlineChanged = existingTask && existingTask.deadline !== formData.deadline;

      if ((isNewTask || isDeadlineChanged) && deadlineDate < today) {
        setError(t('validation.dueDatePastError') || 'Due date cannot be before today.');
        return;
      }
      
      if (existingTask && isDeadlineChanged && existingTask.date) {
        const scheduledDate = startOfDay(parseISO(existingTask.date));
        if (scheduledDate > deadlineDate) {
          setError(t('validation.dueDateBeforeScheduledError') || 'The new due date cannot be earlier than the current scheduled date. Reschedule the task first.');
          return;
        }
      }
    }
    
    // Scheduled Date validation (only for new/edited schedule)
    if (formData.date && !isUnscheduledContext) {
      const scheduledDate = startOfDay(parseISO(formData.date));
      const isNewTask = !existingTask;
      const isDateChanged = existingTask && existingTask.date !== formData.date;
      
      if ((isNewTask || isDateChanged) && scheduledDate < today) {
        setError(t('validation.schedulePastError') || 'Scheduled date must be today or later.');
        return;
      }
      
      if (formData.deadline) {
        const deadlineDate = startOfDay(parseISO(formData.deadline));
        if (scheduledDate > deadlineDate) {
          setError(t('validation.scheduleAfterDueError') || 'Scheduled date must be between today and the due date.');
          return;
        }
      }
      
      // Start time validation for today
      if (isSameDay(scheduledDate, today) && formData.startTime) {
        const now = new Date();
        const [h, m] = formData.startTime.split(':').map(Number);
        const selectedTime = new Date(today);
        selectedTime.setHours(h, m, 0, 0);
        
        // Let's add a small buffer (e.g. 5 minutes) to avoid rejecting immediate schedules
        const bufferTime = new Date(now.getTime() - 5 * 60000);
        if (selectedTime < bufferTime) {
          setError(t('validation.startTimePastError') || 'Start time must be now or later.');
          return;
        }
      }
    }

    // If it's modifying a recurring task`;

if (code.includes('const handleSave = (e?: React.FormEvent) => {\n    if (e) e.preventDefault();\n    \n    // If it\'s modifying a recurring task')) {
    code = code.replace(handleSaveOriginal, handleSaveNew);
} else {
    console.log("Could not find handleSaveOriginal");
}

// Add startOfDay to imports if not there
if (code.includes("import { format, parseISO") && !code.includes("startOfDay")) {
    code = code.replace(
        "import { format, parseISO",
        "import { format, parseISO, startOfDay, isSameDay"
    );
}

// 5. Min/Max dates in DatePicker
const deadlinePickerOriginal = `<DatePicker
                  value={formData.deadline || ''}
                  onChange={date => setFormData({ ...formData, deadline: date })}
                  className="block w-full font-semibold px-3 py-2"
                />`;
const deadlinePickerNew = `<DatePicker
                  value={formData.deadline || ''}
                  onChange={date => setFormData({ ...formData, deadline: date })}
                  className="block w-full font-semibold px-3 py-2"
                  minDate={new Date()}
                />`;
code = code.replace(deadlinePickerOriginal, deadlinePickerNew);

const datePickerOriginal = `<DatePicker
                  value={formData.date}
                  onChange={date => {
                    const defaultStart = settings?.workingHours?.[new Date().getDay()]?.start || '09:00';
                    setFormData({ 
                      ...formData, 
                      date,
                      startTime: formData.startTime || defaultStart,
                      endTime: formData.endTime || '10:00'
                    });
                  }}
                  className="block w-full font-semibold px-3 py-2"
                />`;
const datePickerNew = `<DatePicker
                  value={formData.date}
                  onChange={date => {
                    const defaultStart = settings?.workingHours?.[new Date().getDay()]?.start || '09:00';
                    setFormData({ 
                      ...formData, 
                      date,
                      startTime: formData.startTime || defaultStart,
                      endTime: formData.endTime || '10:00'
                    });
                  }}
                  className="block w-full font-semibold px-3 py-2"
                  minDate={new Date()}
                  maxDate={formData.deadline ? parseISO(formData.deadline) : undefined}
                />`;
code = code.replace(datePickerOriginal, datePickerNew);


fs.writeFileSync('src/components/TaskModal.tsx', code);
console.log('TaskModal patched successfully');
