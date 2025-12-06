import type { Express } from "express";
import { createAuthRouter } from "./auth.js";
import { createDashboardRouter } from "./dashboard.js";
import { createBookingRouter } from "./booking.js";
import { createAdminRouter } from "./admin.js";
import type { AuthController } from "../controllers/authController.js";
import type { DashboardController } from "../controllers/dashboardController.js";
import type { BookingController } from "../controllers/bookingController.js";
import type { AdminController } from "../controllers/adminController.js";

export interface ControllerRegistry {
	auth: AuthController;
	dashboard: DashboardController;
	booking: BookingController;
	admin: AdminController;
}

export function registerRoutes(app: Express, controllers: ControllerRegistry): void {
	app.use(createAuthRouter(controllers.auth));
	app.use(createDashboardRouter(controllers.dashboard));
	app.use(createBookingRouter(controllers.booking));
	app.use(createAdminRouter(controllers.admin));

	app.get("/", (req, res) => {
		if (req.session?.userId) {
			res.redirect("/dashboard");
			return;
		}
		res.redirect("/login");
	});

	app.use((_req, res) => {
		res.status(404).render("errors/404", {
			pageTitle: "Nie znaleziono strony"
		});
	});
}
