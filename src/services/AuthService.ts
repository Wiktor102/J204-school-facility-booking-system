import bcrypt from "bcrypt";
import type { Request } from "express";
import type { UserRepository } from "../repositories/UserRepository.js";
import { validate, validateEmail, validateName, validatePassword } from "../utils/validators.js";
import { AuthError, ValidationAppError } from "../utils/errors.js";
import { UserRole, type User } from "../types/models.js";

export class AuthService {
	constructor(private users: UserRepository) {}

	async register(params: { email: string; password: string; firstName: string; lastName: string }): Promise<User> {
		const validation = validate([
			validateEmail(params.email),
			validatePassword(params.password),
			validateName(params.firstName, "Imię"),
			validateName(params.lastName, "Nazwisko")
		]);

		if (!validation.isValid) {
			throw new ValidationAppError("Błędne dane rejestracji", validation.errors);
		}

		const existing = await this.users.findByEmail(params.email);
		if (existing) {
			throw new ValidationAppError("Użytkownik z tym e-mailem już istnieje");
		}

		const passwordHash = await bcrypt.hash(params.password, 12);
		const id = await this.users.create(params.email, passwordHash, params.firstName, params.lastName, UserRole.STUDENT);
		const user = await this.users.findById(id);
		if (!user) {
			throw new Error("Nie udało się utworzyć użytkownika");
		}
		return user;
	}

	async login(req: Request, email: string, password: string): Promise<User> {
		const user = await this.users.findByEmail(email);
		if (!user) {
			throw new AuthError("Nieprawidłowe dane logowania");
		}
		const match = await bcrypt.compare(password, user.passwordHash);
		if (!match) {
			throw new AuthError("Nieprawidłowe dane logowania");
		}
		if (!req.session) {
			throw new Error("Brak sesji");
		}
		req.session.userId = user.id;
		req.session.userRole = user.role;
		req.currentUser = user;
		return user;
	}

	async logout(req: Request): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			req.session?.destroy((err) => {
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	async attachCurrentUser(req: Request): Promise<void> {
		if (!req.session?.userId) {
			req.currentUser = undefined;
			return;
		}
		const user = await this.users.findById(req.session.userId);
		if (!user) {
			req.currentUser = undefined;
			return;
		}
		req.currentUser = user;
	}
}
