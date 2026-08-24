const fs = require('fs');
let code = fs.readFileSync('src/components/DatePicker.tsx', 'utf8');

code = code.replace(
  'interface DatePickerProps {\n  value: string; // YYYY-MM-DD\n  onChange: (date: string) => void;\n  className?: string;\n  required?: boolean;\n  disabled?: boolean;\n}',
  'interface DatePickerProps {\n  value: string; // YYYY-MM-DD\n  onChange: (date: string) => void;\n  className?: string;\n  required?: boolean;\n  disabled?: boolean;\n  minDate?: Date;\n  maxDate?: Date;\n}'
);

fs.writeFileSync('src/components/DatePicker.tsx', code);
console.log('Fixed DatePicker interface');
