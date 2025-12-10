import { createObjectCsvWriter } from "csv-writer";
import fs from "fs/promises";
import path from "path";
import type { BookingRepository, BookingWithNames } from "../repositories/BookingRepository.js";
import type { EquipmentRepository } from "../repositories/EquipmentRepository.js";
import { ValidationAppError } from "../utils/errors.js";
import { validate, validateName } from "../utils/validators.js";
import type { Equipment } from "../types/models.js";

export class AdminService {
	constructor(
		private bookings: BookingRepository,
		private equipmentRepo: EquipmentRepository
	) {}

	async addEquipment(data: {
		name: string;
		iconName: string;
		accentColor: string;
		dailyStartHour: number;
		dailyEndHour: number;
		minDurationMinutes: number;
		maxDurationMinutes: number;
	}): Promise<number> {
		const validation = validate([validateName(data.name, "Nazwa")]);
		if (!validation.isValid) {
			throw new ValidationAppError("Błędne dane sprzętu", validation.errors);
		}
		return this.equipmentRepo.create(data);
	}

	async updateEquipment(id: number, fields: Partial<Equipment>): Promise<Equipment | null> {
		await this.equipmentRepo.update(id, fields);
		return this.equipmentRepo.findById(id);
	}

	async toggleEquipment(id: number, active: boolean): Promise<void> {
		await this.equipmentRepo.toggleAvailability(id, active);
	}

	async createBlock(data: {
		equipmentId: number;
		blockDate: string;
		startTime: string;
		endTime: string;
		reason?: string;
		createdBy: number;
	}): Promise<number> {
		// Validate times are within equipment working hours
		const equipment = await this.equipmentRepo.findById(data.equipmentId);
		if (!equipment) {
			throw new ValidationAppError("Sprzęt nie istnieje");
		}

		const toMinutes = (time: string) => {
			const [h, m] = time.split(":").map(Number);
			return h * 60 + m;
		};

		const startMinutes = toMinutes(data.startTime);
		const endMinutes = toMinutes(data.endTime);
		const dayStart = equipment.dailyStartHour * 60;
		const dayEnd = equipment.dailyEndHour * 60;

		if (startMinutes < dayStart || endMinutes > dayEnd) {
			throw new ValidationAppError(
				`Blokada musi być w godzinach pracy sprzętu (${equipment.dailyStartHour}:00 - ${equipment.dailyEndHour}:00)`
			);
		}

		if (startMinutes >= endMinutes) {
			throw new ValidationAppError("Godzina rozpoczęcia musi być przed godziną zakończenia");
		}

		return this.bookings.createBlockedSlot(data);
	}

	async removeBlock(id: number): Promise<void> {
		await this.bookings.deleteBlockedSlot(id);
	}

	async cancelBooking(id: number): Promise<void> {
		await this.bookings.cancel(id);
	}

	async listBookings(params: {
		equipmentId?: number;
		dateFrom?: string;
		dateTo?: string;
		student?: string;
		sort?: "date" | "student" | "equipment";
		order?: "asc" | "desc";
		page?: number;
		pageSize?: number;
	}): Promise<{
		data: BookingWithNames[];
		total: number;
		page: number;
		pageSize: number;
	}> {
		const { bookings, total } = await this.bookings.listAllWithFilters(params);
		return {
			data: bookings,
			total,
			page: params.page ?? 1,
			pageSize: params.pageSize ?? 20
		};
	}

	async exportCsv(filePath: string): Promise<string> {
		const { bookings } = await this.bookings.listAllWithFilters({
			page: 1,
			pageSize: 1000
		});
		const absolute = path.resolve(filePath);
		await fs.mkdir(path.dirname(absolute), { recursive: true });
		const writer = createObjectCsvWriter({
			path: absolute,
			header: [
				{ id: "id", title: "ID" },
				{ id: "equipmentName", title: "Sprzęt" },
				{ id: "userName", title: "Użytkownik" },
				{ id: "bookingDate", title: "Data" },
				{ id: "startTime", title: "Start" },
				{ id: "endTime", title: "Koniec" },
				{ id: "status", title: "Status" }
			]
		});

		await writer.writeRecords(
			bookings.map((b) => ({
				...b,
				bookingDate: b.bookingDate instanceof Date ? b.bookingDate.toISOString().slice(0, 10) : b.bookingDate
			}))
		);

		return absolute;
	}

	async stats(): Promise<{ totalBookings: number; activeEquipment: number }> {
		const { total } = await this.bookings.listAllWithFilters({
			page: 1,
			pageSize: 1
		});
		const equipment = await this.equipmentRepo.listActive();
		return {
			totalBookings: total,
			activeEquipment: equipment.length
		};
	}
}
