import type { UserRole } from "./models";

declare module "express-session" {
	interface SessionData {
		userId?: number;
		userRole?: UserRole;
		csrfToken?: string;
	}
}

declare global {
	namespace Express {
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
