const { parse } = require('date-fns');
const d = parse('2026-08-24 09:00', 'yyyy-MM-dd HH:mm', new Date());
console.log(d.toString());
