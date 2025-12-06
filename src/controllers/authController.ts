import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService.js";
import { AuthError, ValidationAppError } from "../utils/errors.js";

interface AuthViewModel {
	mode: "login" | "register";
	errors: string[];
	formData: Partial<{ email: string; firstName: string; lastName: string }>;
}

export class AuthController {
	constructor(private authService: AuthService) {}

	showLogin = (req: Request, res: Response): void => {
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
	};

	login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { email, password } = req.body ?? {};
		try {
			await this.authService.login(req, email, password);
			res.redirect("/dashboard");
		} catch (error) {
			if (error instanceof ValidationAppError || error instanceof AuthError) {
				const viewModel: AuthViewModel = {
					mode: "login",
					errors: [error.message],
					formData: { email }
				};
				res.status(400).render("auth/login", {
					pageTitle: "Logowanie do systemu",
					viewModel
				});
				return;
			}
			next(error);
		}
	};

	register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { email, password, firstName, lastName } = req.body ?? {};
		try {
			await this.authService.register({ email, password, firstName, lastName });
			await this.authService.login(req, email, password);
			res.redirect("/dashboard");
		} catch (error) {
			if (error instanceof ValidationAppError) {
				const viewModel: AuthViewModel = {
					mode: "register",
					errors:
						error.details && Array.isArray(error.details)
							? error.details.map((item) => item.message)
							: [error.message],
					formData: { email, firstName, lastName }
				};
				res.status(400).render("auth/login", { pageTitle: "Rejestracja", viewModel });
				return;
			}
			next(error);
		}
	};

	logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			await this.authService.logout(req);
			res.redirect("/login");
		} catch (error) {
			next(error);
		}
	};
}
