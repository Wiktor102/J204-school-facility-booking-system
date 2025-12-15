import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService.js";
import { AuthError, ValidationAppError } from "../utils/errors.js";
import { BaseController } from "./BaseController.js";

interface AuthViewModel {
	mode: "login" | "register";
	errors: string[];
	formData: Partial<{ email: string; firstName: string; lastName: string }>;
}

export class AuthController extends BaseController {
	constructor(private authService: AuthService) {
		super();
	}

	showLogin(req: Request, res: Response): void {
		if (req.session?.userId) {
			res.redirect("/dashboard");
			return;
		}
		const viewModel: AuthViewModel = {
			mode: "login",
			errors: [],
			formData: {}
		};
		res.render("auth/login", { pageTitle: "Logowanie do systemu", viewModel });
	}

	async login(req: Request, res: Response, next: NextFunction): Promise<void> {
		const { email, password } = req.body ?? {};
		try {
			await this.authService.login(req, email, password);
			res.redirect("/dashboard");
		} catch (error) {
			if (error instanceof ValidationAppError || error instanceof AuthError) {
				this.renderAuthError(res, "login", [error.message], { email });
				return;
			}
			next(error);
		}
	}

	async register(req: Request, res: Response, next: NextFunction): Promise<void> {
		const { email, password, firstName, lastName } = req.body ?? {};
		try {
			await this.authService.register({ email, password, firstName, lastName });
			await this.authService.login(req, email, password);
			res.redirect("/dashboard");
		} catch (error) {
			if (error instanceof ValidationAppError) {
				const errors =
					error.details && Array.isArray(error.details)
						? error.details.map((item) => item.message)
						: [error.message];
				this.renderAuthError(res, "register", errors, { email, firstName, lastName });
				return;
			}
			next(error);
		}
	}

	async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			await this.authService.logout(req);
			res.redirect("/login");
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Renders the auth view with error messages and preserved form data.
	 */
	private renderAuthError(
		res: Response,
		mode: "login" | "register",
		errors: string[],
		formData: Partial<{ email: string; firstName: string; lastName: string }>
	): void {
		const viewModel: AuthViewModel = { mode, errors, formData };
		const pageTitle = mode === "login" ? "Logowanie do systemu" : "Rejestracja";
		res.status(400).render("auth/login", { pageTitle, viewModel });
	}
}
