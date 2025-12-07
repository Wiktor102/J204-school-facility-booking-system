import type { Request, Response, NextFunction } from "express";
import { AuthError, ForbiddenError } from "../utils/errors.js";
import { UserRole } from "../types/models.js";
// CSRF handling removed — tokens are no longer generated or verified

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
	if (!req.session?.userId) {
		next(new AuthError("Wymagane logowanie"));
		return;
	}
	next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
	if (!req.session?.userId) {
		next(new AuthError("Wymagane logowanie"));
		return;
	}
	if (req.session.userRole !== UserRole.ADMIN) {
		next(new ForbiddenError("Brak uprawnień administracyjnych"));
		return;
	}
	next();
}

// Note: CSRF protection removed for this simplified demo. Only authentication
// remains in this middleware.
