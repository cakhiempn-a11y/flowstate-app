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
  'const renderDays = () => {\n' + declarations + '\n    const start = startOfMonth(currentMonth);'
);

fs.writeFileSync('src/components/DatePicker.tsx', code);
console.log('Fixed DatePicker variables again');
