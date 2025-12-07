import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
	if (err instanceof AppError) {
		const isJson = req.headers["content-type"]?.includes("application/json");

		// If the request is a normal browser navigation and we got an auth error,
		// redirect the user to login instead of responding with JSON.
		if (!isJson && err.statusCode === 401) {
			res.redirect("/login");
			return;
		}

		// For JSON requests, return JSON.
		res.status(err.statusCode).json({
			success: false,
			message: err.message,
			details: err.details
		});
		return;
	}

	console.error("Unexpected error:", err);
	res.status(500).json({
		success: false,
		message: "Wystąpił nieoczekiwany błąd"
	});
}
