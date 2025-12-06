import { Router } from "express";
import { BookingController } from "../controllers/bookingController.js";
import { requireAuth, verifyCsrf } from "../middleware/auth.js";

export function createBookingRouter(controller: BookingController): Router {
	const router = Router();

	router.get("/equipment/:id/calendar", requireAuth, controller.showCalendar);
	router.post("/bookings", requireAuth, verifyCsrf, controller.create);
	router.delete("/bookings/:id", requireAuth, verifyCsrf, controller.cancel);
	router.get("/my-bookings", requireAuth, controller.userBookings);

	return router;
}
