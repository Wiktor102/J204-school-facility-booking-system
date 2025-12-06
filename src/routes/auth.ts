import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { verifyCsrf } from "../middleware/auth.js";

export function createAuthRouter(controller: AuthController): Router {
	const router = Router();

	router.get("/login", controller.showLogin);
	router.post("/login", verifyCsrf, controller.login);
	router.post("/register", verifyCsrf, controller.register);
	router.get("/logout", controller.logout);

	return router;
}
