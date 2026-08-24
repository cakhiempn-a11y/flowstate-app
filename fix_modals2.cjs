const fs = require('fs');

// ScheduleModal
let smCode = fs.readFileSync('src/components/ScheduleModal.tsx', 'utf8');
if (!smCode.includes('const [error, setError]')) {
  smCode = smCode.replace(
    "const [endTime, setEndTime] = useState<string>('');",
    "const [endTime, setEndTime] = useState<string>('');\n  const [error, setError] = useState<string | null>(null);"
  );
  fs.writeFileSync('src/components/ScheduleModal.tsx', smCode);
  console.log('Fixed ScheduleModal error state');
}

// TaskModal imports
let tmCode = fs.readFileSync('src/components/TaskModal.tsx', 'utf8');
if (!tmCode.includes('startOfDay')) {
  const dateFnsRegex = /import \{([^\}]+)\} from 'date-fns';/;
  const match = tmCode.match(dateFnsRegex);
  if (match) {
    const newImport = "import { " + match[1].trim() + ", startOfDay, isSameDay } from 'date-fns';";
    tmCode = tmCode.replace(dateFnsRegex, newImport);
    fs.writeFileSync('src/components/TaskModal.tsx', tmCode);
    console.log('Fixed TaskModal imports');
  }
}
