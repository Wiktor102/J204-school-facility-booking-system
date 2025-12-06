import type { UserRole } from './models.js';

declare global {
  namespace Express {
    interface SessionData {
      userId?: number;
      userRole?: UserRole;
      csrfToken?: string;
    }
    interface Request {
      currentUser?: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
      };
    }
  }
}

export {};
