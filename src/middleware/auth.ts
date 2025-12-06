import type { Request, Response, NextFunction } from 'express';
import { AuthError, ForbiddenError } from '../utils/errors.js';
import { UserRole } from '../types/models.js';
import { generateCsrfToken } from '../utils/sessionHelpers.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    next(new AuthError('Wymagane logowanie'));
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    next(new AuthError('Wymagane logowanie'));
    return;
  }
  if (req.session.userRole !== UserRole.ADMIN) {
    next(new ForbiddenError('Brak uprawnień administracyjnych'));
    return;
  }
  next();
}

export function attachCsrf(req: Request, res: Response, next: NextFunction): void {
  if (!req.session) {
    next();
    return;
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }
  const token = req.body?._csrf || req.headers['x-csrf-token'];
  if (!req.session?.csrfToken || token !== req.session.csrfToken) {
    next(new ForbiddenError('Błędny token CSRF'));
    return;
  }
  next();
}
