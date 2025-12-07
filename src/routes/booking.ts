import { Router } from "express";
import { BookingController } from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/auth.js";

export function createBookingRouter(controller: BookingController): Router {
	const router = Router();

	router.get("/equipment/:id/calendar", requireAuth, controller.showCalendar);
	router.post("/bookings", requireAuth, controller.create);
	router.delete("/bookings/:id", requireAuth, controller.cancel);
	router.get("/my-bookings", requireAuth, controller.userBookings);

	return router;
}
