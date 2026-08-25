import { fromZonedTime } from 'date-fns-tz';
console.log(fromZonedTime('2026-08-25T14:30:00', 'Asia/Ho_Chi_Minh').toISOString());
