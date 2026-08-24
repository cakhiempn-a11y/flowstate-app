const fs = require('fs');
let code = fs.readFileSync('src/components/DatePicker.tsx', 'utf8');

const declarations = `
    const minDateObj = minDate ? startOfDay(minDate) : null;
    const maxDateObj = maxDate ? startOfDay(maxDate) : null;

    const isDateDisabled = (d: Date) => {
      const dStart = startOfDay(d);
      if (minDateObj && dStart < minDateObj) return true;
      if (maxDateObj && dStart > maxDateObj) return true;
      return false;
    };
`;

code = code.replace(
  'const renderDays = () => {\n    const start = startOfMonth(currentMonth);',
  'const renderDays = () => {\n' + declarations + '    const start = startOfMonth(currentMonth);'
);

code = code.replace(declarations, ''); // remove the old one down below, wait, replacing a specific block is tricky
// let's do regex to remove the old ones
code = code.replace(/const minDateObj = minDate \? startOfDay\(minDate\) : null;\s*const maxDateObj = maxDate \? startOfDay\(maxDate\) : null;\s*const isDateDisabled = \((d: Date|d)\) => \{\s*const dStart = startOfDay\(d\);\s*if \(minDateObj && dStart < minDateObj\) return true;\s*if \(maxDateObj && dStart > maxDateObj\) return true;\s*return false;\s*\};\s*/g, '');

fs.writeFileSync('src/components/DatePicker.tsx', code);
console.log('Fixed DatePicker variables');
