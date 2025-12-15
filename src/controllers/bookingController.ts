import type { Request, Response, NextFunction } from "express";
import { BookingService } from "../services/BookingService.js";
import { EquipmentRepository } from "../repositories/EquipmentRepository.js";
import { formatDate, addDaysSafe } from "../utils/dateHelpers.js";
import { ValidationAppError, AppError } from "../utils/errors.js";
import { BookingStatus } from "../types/models.js";
import { BaseController } from "./BaseController.js";

export class BookingController extends BaseController {
	constructor(
		private bookingService: BookingService,
		private equipmentRepository: EquipmentRepository
	) {
		super();
	}

	async showCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const equipmentId = Number(req.params.id);
			const equipment = await this.equipmentRepository.findById(equipmentId);
			if (!equipment) {
				throw new AppError("Sprzęt nie został odnaleziony", 404);
			}

			const dateParam = req.query.date ? String(req.query.date) : null;
			const baseDate = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
			const weekView = await this.bookingService.buildWeekView(equipmentId, baseDate, req.currentUser?.id);

			const nextWeekDate = formatDate(addDaysSafe(weekView.weekStart, 7));
			const prevWeekDate = formatDate(addDaysSafe(weekView.weekStart, -7));

			res.render("calendar", {
				pageTitle: `Kalendarz • ${equipment.name}`,
				equipment,
				weekView,
				selectedDate: formatDate(baseDate),
				nextWeekDate,
				prevWeekDate
			});
		} catch (error) {
			next(error);
		}
	}

	async create(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			if (!req.currentUser) {
				throw new AppError("Musisz być zalogowany", 401);
			}
			const { equipmentId, bookingDate, startTime, duration } = req.body ?? {};
			const equipment = await this.equipmentRepository.findById(Number(equipmentId));
			if (!equipment) {
				throw new AppError("Sprzęt nie istnieje", 404);
			}
			const [startHour, startMinute] = String(startTime)
				.split(":")
				.map((value) => Number(value));
			const endMinutes = startHour * 60 + startMinute + Number(duration);
			const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(
				2,
				"0"
			)}`;

			await this.bookingService.createBooking({
				userId: req.currentUser.id,
				equipmentId: Number(equipmentId),
				bookingDate,
				startTime,
				endTime
			});

			this.respond(req, res, { success: true, message: "Rezerwacja została utworzona" }, 200, "/my-bookings");
		} catch (error) {
			if (error instanceof ValidationAppError) {
				this.respond(req, res, { success: false, message: error.message }, 400, "/my-bookings");
				return;
			}
			next(error);
		}
	}

	async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			if (!req.currentUser) {
				throw new AppError("Musisz być zalogowany", 401);
			}
			const id = Number(req.params.id);
			await this.bookingService.cancelBooking(id, req.currentUser);
			this.respond(req, res, { success: true, message: "Rezerwacja anulowana" }, 200, "/my-bookings");
		} catch (error) {
			if (error instanceof ValidationAppError) {
				this.respond(req, res, { success: false, message: error.message }, 400, "/my-bookings");
				return;
			}
			next(error);
		}
	}

	async userBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			if (!req.currentUser) {
				throw new AppError("Musisz być zalogowany", 401);
			}
			const bookings = await this.bookingService.listUserBookings(req.currentUser.id);
			const stats = {
				active: bookings.filter((b) => b.status === BookingStatus.ACTIVE && !b.isCompleted).length,
				completed: bookings.filter((b) => b.isCompleted).length,
				cancelled: bookings.filter((b) => b.status === BookingStatus.CANCELLED).length
			};
			res.render("myBookings", {
				pageTitle: "Moje rezerwacje",
				bookings,
				stats
			});
		} catch (error) {
			next(error);
		}
	}
}
