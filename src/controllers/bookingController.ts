import type { Request, Response, NextFunction } from "express";
import { BookingService } from "../services/BookingService.js";
import { EquipmentRepository } from "../repositories/EquipmentRepository.js";
import { formatDate } from "../utils/dateHelpers.js";
import { ValidationAppError, AppError } from "../utils/errors.js";
import { BookingStatus } from "../types/models.js";

export class BookingController {
	constructor(
		private bookingService: BookingService,
		private equipmentRepository: EquipmentRepository
	) {}

	showCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const equipmentId = Number(req.params.id);
			const equipment = await this.equipmentRepository.findById(equipmentId);
			if (!equipment) {
				throw new AppError("Sprzęt nie został odnaleziony", 404);
			}

			const baseDate = req.query.date ? new Date(String(req.query.date)) : new Date();
			const weekView = await this.bookingService.buildWeekView(equipmentId, baseDate, req.currentUser?.id);

			const durationOptions: number[] = [];
			for (let duration = equipment.minDurationMinutes; duration <= equipment.maxDurationMinutes; duration += 30) {
				durationOptions.push(duration);
			}

			res.render("calendar", {
				pageTitle: `Kalendarz • ${equipment.name}`,
				equipment,
				weekView,
				durationOptions,
				selectedDate: formatDate(baseDate)
			});
		} catch (error) {
			next(error);
		}
	};

	create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

			this.respond(req, res, {
				success: true,
				message: "Rezerwacja została utworzona"
			});
		} catch (error) {
			if (error instanceof ValidationAppError) {
				this.respond(req, res, { success: false, message: error.message }, 400);
				return;
			}
			next(error);
		}
	};

	cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			if (!req.currentUser) {
				throw new AppError("Musisz być zalogowany", 401);
			}
			const id = Number(req.params.id);
			await this.bookingService.cancelBooking(id, req.currentUser);
			this.respond(req, res, {
				success: true,
				message: "Rezerwacja anulowana"
			});
		} catch (error) {
			if (error instanceof ValidationAppError) {
				this.respond(req, res, { success: false, message: error.message }, 400);
				return;
			}
			next(error);
		}
	};

	userBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
	};

	private respond(req: Request, res: Response, payload: Record<string, unknown>, status = 200): void {
		const isJson = req.headers["content-type"]?.includes("application/json");

		if (isJson) {
			res.status(status).json(payload);
			return;
		}

		if (status >= 400) {
			const fallback = req.get("referer") ?? "/my-bookings";
			res.status(status).redirect(fallback);
			return;
		}

		res.redirect("/my-bookings");
	}
}
