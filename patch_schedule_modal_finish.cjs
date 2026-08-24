const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleModal.tsx', 'utf8');

// Render error
if (!code.includes('{error && (')) {
  code = code.replace(
    '<div className="space-y-4">',
    '{error && (\n            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-semibold">\n              {error}\n            </div>\n          )}\n          <div className="space-y-4">'
  );
}

// Add minDate/maxDate to DatePicker
const datePickerOrig = `<DatePicker
                value={date}
                onChange={handleDateChange}
                className="w-full"
              />`;
const datePickerNew = `<DatePicker
                value={date}
                onChange={handleDateChange}
                className="w-full"
                minDate={new Date()}
                maxDate={task.deadline ? parseISO(task.deadline) : undefined}
              />`;
code = code.replace(datePickerOrig, datePickerNew);

// Add imports
code = code.replace(
    "import { differenceInMinutes, parseISO } from 'date-fns';",
    "import { differenceInMinutes, parseISO, startOfDay, isSameDay } from 'date-fns';"
);

fs.writeFileSync('src/components/ScheduleModal.tsx', code);
console.log('Finished patching ScheduleModal');
