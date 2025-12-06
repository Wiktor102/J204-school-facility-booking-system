import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requireAdmin, verifyCsrf } from '../middleware/auth.js';

export function createAdminRouter(controller: AdminController): Router {
  const router = Router();

  router.get('/admin', requireAdmin, controller.dashboard);
  router.post('/admin/equipment', requireAdmin, verifyCsrf, controller.createEquipment);
  router.patch('/admin/equipment/:id', requireAdmin, verifyCsrf, controller.updateEquipment);
  router.post('/admin/blocked-slots', requireAdmin, verifyCsrf, controller.createBlock);
  router.delete('/admin/blocked-slots/:id', requireAdmin, verifyCsrf, controller.removeBlock);
  router.delete('/admin/bookings/:id', requireAdmin, verifyCsrf, controller.cancelBooking);
  router.get('/admin/bookings', requireAdmin, controller.listBookings);
  router.get('/admin/export', requireAdmin, controller.exportCsv);

  return router;
}
