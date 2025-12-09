import { Router } from "express";
import { AdminController } from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/auth.js";

export function createAdminRouter(controller: AdminController): Router {
	const router = Router();

	router.get("/admin", requireAdmin, controller.dashboard.bind(controller));
	router.post("/admin/equipment", requireAdmin, controller.createEquipment.bind(controller));
	router.patch("/admin/equipment/:id", requireAdmin, controller.updateEquipment.bind(controller));
	router.post("/admin/blocked-slots", requireAdmin, controller.createBlock.bind(controller));
	router.delete("/admin/blocked-slots/:id", requireAdmin, controller.removeBlock.bind(controller));
	router.delete("/admin/bookings/:id", requireAdmin, controller.cancelBooking.bind(controller));
	router.get("/admin/bookings", requireAdmin, controller.listBookings.bind(controller));
	router.get("/admin/export", requireAdmin, controller.exportCsv.bind(controller));

	return router;
}
