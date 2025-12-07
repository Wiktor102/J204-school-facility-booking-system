import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
	if (err instanceof AppError) {
		const acceptHeader = String(req.headers.accept || "");
		const isAjax =
			Boolean(req.xhr) ||
			req.headers["x-requested-with"] === "XMLHttpRequest" ||
			acceptHeader.includes("application/json");
		const prefersHtml = Boolean(req.accepts && req.accepts("html"));

		// If the request is a normal browser navigation and we got an auth error,
		// redirect the user to login instead of responding with JSON.
		if (!isAjax && prefersHtml && err.statusCode === 401) {
			res.redirect("/login");
			return;
		}

		// For AJAX/JSON requests, return JSON as before.
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
