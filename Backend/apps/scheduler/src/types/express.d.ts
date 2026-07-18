import { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      log?: Logger;
      userId?: string;
      isVerified?: boolean;
    }
  }
}
