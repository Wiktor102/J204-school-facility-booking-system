import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
// CSRF verification removed for demo

export function createAuthRouter(controller: AuthController): Router {
	const router = Router();

	router.get("/login", controller.showLogin);
	router.post("/login", controller.login);
	router.post("/register", controller.register);
	router.get("/logout", controller.logout);

	return router;
}
