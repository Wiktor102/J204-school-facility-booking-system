import type { Request, Response, NextFunction } from "express";
import { EquipmentRepository } from "../repositories/EquipmentRepository.js";
import { BookingService } from "../services/BookingService.js";
import { formatDate, addDaysSafe } from "../utils/dateHelpers.js";
import { BookingStatus } from "../types/models.js";

export class DashboardController {
	constructor(
		private equipmentRepository: EquipmentRepository,
		private bookingService: BookingService
	) {}

	show = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const user = req.currentUser;
			const equipment = await this.equipmentRepository.listActive();
			const summaries = await Promise.all(
				equipment.map(async (item) => ({
					equipment: item,
					slots: await this.loadUpcomingSlots(item.id, user?.id)
				}))
			);

			let bookingCount = 0;
			let recentBookings: Array<{
				equipmentName: string;
				bookingDate: Date;
				startTime: string;
			}> = [];

			if (user) {
				const bookings = await this.bookingService.listUserBookings(user.id);
				bookingCount = bookings.filter((b) => b.status === BookingStatus.ACTIVE && !b.isCompleted).length;
				recentBookings = bookings.slice(0, 3).map((b) => ({
					equipmentName: b.equipmentName,
					bookingDate: new Date(b.bookingDate),
					startTime: b.startTime
				}));
			}

			const activity = await this.bookingService.recentActivity();

			res.render("dashboard", {
				pageTitle: "Panel główny",
				equipmentSummaries: summaries,
				bookingCount,
				recentBookings,
				activity
			});
		} catch (error) {
			next(error);
		}
	};

	private async loadUpcomingSlots(
		equipmentId: number,
		userId?: number
	): Promise<Array<{ date: string; startTime: string; endTime: string }>> {
		const slots: Array<{ date: string; startTime: string; endTime: string }> = [];
		for (let offset = 0; offset < 7 && slots.length < 3; offset++) {
			const date = addDaysSafe(new Date(), offset);
			const formatted = formatDate(date);
			const daySlots = await this.bookingService.generateSlots(equipmentId, formatted, userId);

			for (const slot of daySlots.slots) {
				if (!slot.isAvailable) continue;
				slots.push({
					date: formatted,
					startTime: slot.startTime,
					endTime: slot.endTime
				});

				if (slots.length === 3) break;
			}
		}
		return slots;
	}
}
