import session from 'express-session';
import { NODE_ENV, JWT_SECRET } from '../secrets';

export const sessionConfig = session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production', // HTTPS only in production
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  },
  name: 'apple_auth_sid', // Custom session cookie name
});