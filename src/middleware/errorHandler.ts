import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			success: false,
			message: err.message,
			details: err.details
		});
		return;
	}

	// eslint-disable-next-line no-console
	console.error("Unexpected error:", err);
	res.status(500).json({
		success: false,
		message: "Wystąpił nieoczekiwany błąd"
	});
}
