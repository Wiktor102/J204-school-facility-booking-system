import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
// CSRF verification removed for demo

export function createAuthRouter(controller: AuthController): Router {
	const router = Router();

	router.get("/login", controller.showLogin.bind(controller));
	router.post("/login", controller.login.bind(controller));
	router.post("/register", controller.register.bind(controller));
	router.get("/logout", controller.logout.bind(controller));

	return router;
}
