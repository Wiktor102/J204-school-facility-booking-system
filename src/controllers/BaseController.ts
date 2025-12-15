import type { Request, Response } from "express";
import { AppError, ValidationAppError } from "../utils/errors.js";

export interface FormErrorContext {
	view: string;
	pageTitle: string;
	getViewData: () => Promise<Record<string, unknown>>;
}

/**
 * Base controller class providing shared utilities for all controllers.
 * Centralizes common patterns like JSON detection, response handling, and form error rendering.
 */
export abstract class BaseController {
	/**
	 * Determines if the request expects a JSON response based on Accept or Content-Type headers.
	 */
	protected expectsJson(req: Request): boolean {
		const acceptHeader = Array.isArray(req.headers.accept) ? req.headers.accept.join(",") : (req.headers.accept ?? "");
		if (acceptHeader.includes("application/json")) {
			return true;
		}
		const contentTypeHeader = req.headers["content-type"];
		const contentType = Array.isArray(contentTypeHeader) ? contentTypeHeader.join(",") : (contentTypeHeader ?? "");
		return contentType.includes("application/json");
	}

	/**
	 * Sends a response based on the request type (JSON or redirect).
	 * For JSON requests, sends JSON. For form submissions, redirects.
	 */
	protected respond(req: Request, res: Response, payload: Record<string, unknown>, status = 200, redirectUrl = "/"): void {
		if (this.expectsJson(req)) {
			res.status(status).json(payload);
			return;
		}

		if (status >= 400) {
			const fallback = req.get("referer") ?? redirectUrl;
			res.redirect(fallback);
			return;
		}

		res.redirect(redirectUrl);
	}

	/**
	 * Renders a form view with an error message.
	 * Used when a validation error occurs and we need to re-display the form.
	 */
	protected async renderFormError(
		res: Response,
		context: FormErrorContext,
		errorMessage: string,
		status = 400
	): Promise<void> {
		const viewData = await context.getViewData();
		res.status(status).render(context.view, {
			pageTitle: context.pageTitle,
			...viewData,
			formError: errorMessage
		});
	}

	/**
	 * Handles errors for routes that can respond with JSON or render a form.
	 * Returns true if the error was handled, false if it should be passed to next().
	 */
	protected async handleError(
		error: unknown,
		req: Request,
		res: Response,
		formContext?: FormErrorContext
	): Promise<boolean> {
		if (this.expectsJson(req)) {
			const status = error instanceof AppError ? error.statusCode : 500;
			const message = error instanceof Error ? error.message : "Błąd systemu";
			res.status(status).json({ success: false, message });
			return true;
		}

		if (error instanceof ValidationAppError && formContext) {
			await this.renderFormError(res, formContext, error.message);
			return true;
		}

		return false;
	}

	/**
	 * Converts a value to an optional number, returning undefined for empty/invalid values.
	 */
	protected toOptionalNumber(value: unknown): number | undefined {
		if (value === undefined || value === null || value === "") {
			return undefined;
		}

		if (typeof value === "number") {
			return Number.isFinite(value) ? value : undefined;
		}

		if (typeof value === "string") {
			const trimmed = value.trim();
			if (!trimmed) {
				return undefined;
			}
			const parsed = Number(trimmed);
			return Number.isFinite(parsed) ? parsed : undefined;
		}

		return undefined;
	}

	/**
	 * Converts a value to an optional boolean, returning undefined for empty/invalid values.
	 */
	protected toOptionalBoolean(value: unknown): boolean | undefined {
		if (value === undefined || value === null || value === "") {
			return undefined;
		}

		if (typeof value === "boolean") {
			return value;
		}

		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (normalized === "true") {
				return true;
			}
			if (normalized === "false") {
				return false;
			}
		}

		return undefined;
	}
}
