import { Router } from "express";
import { BookingController } from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/auth.js";

export function createBookingRouter(controller: BookingController): Router {
	const router = Router();

	router.get("/equipment/:id/calendar", requireAuth, controller.showCalendar.bind(controller));
	router.post("/bookings", requireAuth, controller.create.bind(controller));
	router.delete("/bookings/:id", requireAuth, controller.cancel.bind(controller));
	router.get("/my-bookings", requireAuth, controller.userBookings.bind(controller));

	return router;
}
