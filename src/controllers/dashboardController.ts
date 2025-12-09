import type { Request, Response, NextFunction } from "express";
import { EquipmentRepository } from "../repositories/EquipmentRepository.js";
import { BookingService } from "../services/BookingService.js";
import { BookingStatus } from "../types/models.js";

export class DashboardController {
	constructor(
		private equipmentRepository: EquipmentRepository,
		private bookingService: BookingService
	) {}

	async show(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const user = req.currentUser;
			const equipment = await this.equipmentRepository.listActive();
			const summaries = await Promise.all(
				equipment.map(async (item) => ({
					equipment: item
				}))
			);

			let bookingCount = 0;

			if (user) {
				const bookings = await this.bookingService.listUserBookings(user.id);
				bookingCount = bookings.filter((b) => b.status === BookingStatus.ACTIVE && !b.isCompleted).length;
			}

			res.render("dashboard", {
				pageTitle: "Panel główny",
				equipmentSummaries: summaries,
				bookingCount
			});
		} catch (error) {
			next(error);
		}
	}
}
