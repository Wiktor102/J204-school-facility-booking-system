import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/environment.js";
import { AuthService } from "../services/AuthService.js";
import { errorHandler } from "./errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerMiddleware(app: Express, authService: AuthService): Promise<void> {
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());

	app.use(
		session({
			secret: env.session.secret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				maxAge: env.session.maxAge,
				sameSite: "lax"
			}
		})
	);

	app.use(async (req: Request, _res: Response, next: NextFunction) => {
		try {
			await authService.attachCurrentUser(req);
			next();
		} catch (error) {
			next(error);
		}
	});

	app.use((req: Request, res: Response, next: NextFunction) => {
		res.locals.currentUser = req.currentUser;
		res.locals.year = new Date().getFullYear();
		next();
	});

	app.use(express.static(path.join(__dirname, "../../public")));
	app.use(errorHandler);
}
