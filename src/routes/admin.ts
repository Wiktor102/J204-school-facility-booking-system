import { Router } from "express";
import { AdminController } from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/auth.js";

export function createAdminRouter(controller: AdminController): Router {
	const router = Router();

	router.get("/admin", requireAdmin, controller.dashboard);
	router.post("/admin/equipment", requireAdmin, controller.createEquipment);
	router.patch("/admin/equipment/:id", requireAdmin, controller.updateEquipment);
	router.post("/admin/blocked-slots", requireAdmin, controller.createBlock);
	router.delete("/admin/blocked-slots/:id", requireAdmin, controller.removeBlock);
	router.delete("/admin/bookings/:id", requireAdmin, controller.cancelBooking);
	router.get("/admin/bookings", requireAdmin, controller.listBookings);
	router.get("/admin/export", requireAdmin, controller.exportCsv);

	return router;
}
