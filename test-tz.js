import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
console.log(formatInTimeZone(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm'));
