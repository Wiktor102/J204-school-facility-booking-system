import type { BookingRepository, BookingWithNames } from "../repositories/BookingRepository.js";
import type { EquipmentRepository } from "../repositories/EquipmentRepository.js";
import { validate, validateBookingDuration, validateBookingTime } from "../utils/validators.js";
import { AppError, ForbiddenError, ValidationAppError } from "../utils/errors.js";
import { BookingStatus } from "../types/models.js";
import type { Booking, CalendarEvent, DaySlots, WeekView } from "../types/models.js";
import { getWeekRange, buildWeekDays, getDayName, formatDate } from "../utils/dateHelpers.js";

function toMinutes(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}

function minutesToTime(minutes: number): string {
	const h = Math.floor(minutes / 60)
		.toString()
		.padStart(2, "0");
	const m = (minutes % 60).toString().padStart(2, "0");
	return `${h}:${m}`;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
	const aS = toMinutes(aStart);
	const aE = toMinutes(aEnd);
	const bS = toMinutes(bStart);
	const bE = toMinutes(bEnd);
	return !(aE <= bS || bE <= aS);
}

function isCompletedBooking(booking: Booking): boolean {
	const endDate = new Date(booking.bookingDate);
	const [h, m] = booking.endTime.split(":").map(Number);
	endDate.setHours(h, m, 0, 0);
	return endDate.getTime() <= Date.now() && booking.status === "active";
}

export class BookingService {
	constructor(
		private bookings: BookingRepository,
		private equipmentRepo: EquipmentRepository
	) {}

	async generateDayEvents(equipmentId: number, date: string, currentUserId?: number): Promise<DaySlots> {
		const equipment = await this.equipmentRepo.findById(equipmentId);
		if (!equipment) {
			throw new AppError("Sprzęt nie istnieje", 404);
		}

		const bookings = await this.bookings.findByEquipmentAndDate(equipmentId, date);
		const blocks = await this.bookings.getBlockedSlots(equipmentId, date);

		const events: CalendarEvent[] = [];

		// Add bookings as events
		for (const booking of bookings) {
			if (booking.status !== "active") continue;
			events.push({
				id: booking.id,
				startTime: booking.startTime,
				endTime: booking.endTime,
				type: "booking",
				isOwn: booking.userId === currentUserId,
				isCompleted: isCompletedBooking(booking)
			});
		}

		// Add blocked slots as events (clamped to working hours)
		const dayStartMinutes = equipment.dailyStartHour * 60;
		const dayEndMinutes = equipment.dailyEndHour * 60;

		for (const block of blocks) {
			const blockStart = toMinutes(block.start_time);
			const blockEnd = toMinutes(block.end_time);

			// Skip blocks entirely outside working hours
			if (blockEnd <= dayStartMinutes || blockStart >= dayEndMinutes) {
				continue;
			}

			// Clamp to working hours
			const clampedStart = Math.max(blockStart, dayStartMinutes);
			const clampedEnd = Math.min(blockEnd, dayEndMinutes);

			events.push({
				id: block.id,
				startTime: minutesToTime(clampedStart),
				endTime: minutesToTime(clampedEnd),
				type: "blocked",
				isOwn: false,
				isCompleted: false,
				reason: block.reason ?? undefined
			});
		}

		// Sort events by start time
		events.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

		return {
			date: new Date(date),
			dayName: getDayName(new Date(date)),
			slots: [], // Legacy field, kept for compatibility
			events
		};
	}

	async buildWeekView(equipmentId: number, startDate: Date, currentUserId?: number): Promise<WeekView> {
		const { start, end } = getWeekRange(startDate);
		const days = buildWeekDays(start, end);
		const slots: DaySlots[] = [];

		for (const day of days) {
			const dayStr = formatDate(day);
			const daySlots = await this.generateDayEvents(equipmentId, dayStr, currentUserId);
			slots.push(daySlots);
		}

		return {
			weekStart: start,
			weekEnd: end,
			days: slots
		};
	}

	async createBooking(params: {
		userId: number;
		equipmentId: number;
		bookingDate: string;
		startTime: string;
		endTime: string;
	}): Promise<number> {
		const equipment = await this.equipmentRepo.findById(params.equipmentId);
		if (!equipment || !equipment.isActive) {
			throw new ValidationAppError("Sprzęt jest niedostępny");
		}

		const validation = validate([
			validateBookingTime(params.startTime, params.endTime, equipment),
			validateBookingDuration(params.startTime, params.endTime, equipment)
		]);

		if (!validation.isValid) {
			throw new ValidationAppError("Błędne dane rezerwacji", validation.errors);
		}

		const existingOwn = await this.bookings.findActiveByUserAndEquipment(params.userId, params.equipmentId);
		if (existingOwn) {
			throw new ValidationAppError("Masz już aktywną rezerwację na ten sprzęt");
		}

		const sameDayBookings = await this.bookings.findByEquipmentAndDate(params.equipmentId, params.bookingDate);
		const blocked = await this.bookings.getBlockedSlots(params.equipmentId, params.bookingDate);

		const conflict = sameDayBookings.some((b) => overlaps(params.startTime, params.endTime, b.startTime, b.endTime));
		if (conflict) {
			throw new ValidationAppError("Ten termin jest już zajęty");
		}

		const blockConflict = blocked.some((block) =>
			overlaps(params.startTime, params.endTime, block.start_time, block.end_time)
		);
		if (blockConflict) {
			throw new ValidationAppError("Termin jest zablokowany przez administratora");
		}

		return this.bookings.create({
			userId: params.userId,
			equipmentId: params.equipmentId,
			bookingDate: params.bookingDate,
			startTime: params.startTime,
			endTime: params.endTime,
			status: BookingStatus.ACTIVE
		});
	}

	async cancelBooking(id: number, currentUser: { id: number; role: string }): Promise<void> {
		const booking = await this.bookings.findById(id);
		if (!booking) {
			throw new AppError("Rezerwacja nie istnieje", 404);
		}
		if (booking.userId !== currentUser.id && currentUser.role !== "admin") {
			throw new ForbiddenError("Brak uprawnień do anulowania");
		}
		await this.bookings.cancel(id);
	}

	async listUserBookings(userId: number): Promise<(BookingWithNames & { isCompleted: boolean })[]> {
		const list = await this.bookings.listUserBookings(userId);
		return list.map((b) => ({ ...b, isCompleted: isCompletedBooking(b) }));
	}

	// recentActivity removed - activity panel removed from dashboard
}

function anonymizeName(fullName: string): string {
	const [first, last] = fullName.split(" ");
	if (!first) {
		return "Anonim";
	}
	const lastInitial = last ? `${last.charAt(0)}.` : "";
	return `${first} ${lastInitial}`;
}
