export class AppError extends Error {
	statusCode: number;
	details?: unknown;

	constructor(message: string, statusCode = 500, details?: unknown) {
		super(message);
		this.statusCode = statusCode;
		this.details = details;
	}
}

export class ValidationAppError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, 400, details);
	}
}

export class AuthError extends AppError {
	constructor(message: string, statusCode = 401) {
		super(message, statusCode);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string) {
		super(message, 403);
	}
}
