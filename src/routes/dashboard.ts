import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

export function createDashboardRouter(controller: DashboardController): Router {
	const router = Router();
	router.get("/dashboard", requireAuth, controller.show);
	return router;
}
