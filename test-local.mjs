import 'dotenv/config';
import handler from './api/process-notifications.ts';

const req = {
  method: 'POST',
  headers: {
    authorization: 'Bearer flowstate-cron-secure-token-8f92a'
  },
  query: {}
};

const res = {
  setHeader: () => {},
  status: (code) => ({
    json: (data) => {
      console.log('STATUS:', code);
      console.log('JSON:', JSON.stringify(data, null, 2));
    },
    end: () => console.log('END', code)
  })
};

handler(req, res).catch(console.error);
