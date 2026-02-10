import 'express-session';

declare module 'express-session' {
  interface SessionData {
    appleOAuthState?: string;
    appleOAuthContext?: {
      successRedirect: string;
      failureRedirect: string;
    };
  }
}