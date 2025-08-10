import { doubleCsrf } from 'csrf-csrf';
import config from '@config/index.js';

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.jwt.secret,
  cookieName: 'csrf-token',
  cookieOptions: {
    secure: config.env === 'production',
    sameSite: 'strict',
  },
});

export default doubleCsrfProtection;