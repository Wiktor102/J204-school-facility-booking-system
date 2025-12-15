import type { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { AdminService } from "../services/AdminService.js";
import { EquipmentRepository } from "../repositories/EquipmentRepository.js";
import { ValidationAppError, AppError } from "../utils/errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AdminController {
	constructor(
		private adminService: AdminService,
		private equipmentRepository: EquipmentRepository
	) {}

	async dashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const stats = await this.adminService.stats();
			const equipment = await this.equipmentRepository.listAll();
			res.render("admin/dashboard", {
				pageTitle: "Panel administratora",
				stats,
				equipment
			});
		} catch (error) {
			next(error);
		}
	}

	async createEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const payload = {
				name: req.body?.name,
				iconName: req.body?.iconName,
				accentColor: req.body?.accentColor,
				dailyStartHour: Number(req.body?.dailyStartHour ?? 14),
				dailyEndHour: Number(req.body?.dailyEndHour ?? 22),
				minDurationMinutes: Number(req.body?.minDurationMinutes ?? 60),
				maxDurationMinutes: Number(req.body?.maxDurationMinutes ?? 120)
			};
			await this.adminService.addEquipment(payload);
			res.redirect("/admin");
		} catch (error) {
			if (error instanceof ValidationAppError) {
				res.status(400).render("admin/dashboard", {
					pageTitle: "Panel administratora",
					stats: await this.adminService.stats(),
					equipment: await this.equipmentRepository.listAll(),
					formError: error.message
				});
				return;
			}
			next(error);
		}
	}

	async updateEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const expectsJson = this.expectsJson(req);
			const updated = await this.adminService.updateEquipment(id, {
				name: req.body?.name,
				iconName: req.body?.iconName,
				accentColor: req.body?.accentColor,
				dailyStartHour: this.toOptionalNumber(req.body?.dailyStartHour),
				dailyEndHour: this.toOptionalNumber(req.body?.dailyEndHour),
				minDurationMinutes: this.toOptionalNumber(req.body?.minDurationMinutes),
				maxDurationMinutes: this.toOptionalNumber(req.body?.maxDurationMinutes),
				isActive: this.toOptionalBoolean(req.body?.isActive)
			});
			if (!updated) {
				if (expectsJson) {
					res.status(404).json({ success: false, message: "Sprzęt nie istnieje." });
					return;
				}
				throw new AppError("Sprzęt nie istnieje.", 404);
			}
			if (expectsJson) {
				res.json({ success: true, equipment: updated });
				return;
			}
			res.redirect("/admin");
		} catch (error) {
			if (this.expectsJson(req)) {
				const status = error instanceof AppError ? error.statusCode : 500;
				res.status(status).json({
					success: false,
					message: error instanceof Error ? error.message : "Błąd systemu"
				});
				return;
			}
			next(error);
		}
	}

	async createBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			if (!req.currentUser) {
				throw new AppError("Brak użytkownika", 401);
			}
			await this.adminService.createBlock({
				equipmentId: Number(req.body?.equipmentId),
				blockDate: req.body?.blockDate,
				startTime: req.body?.startTime,
				endTime: req.body?.endTime,
				reason: req.body?.reason,
				createdBy: req.currentUser.id
			});
			res.redirect("/admin");
		} catch (error) {
			if (error instanceof ValidationAppError) {
				res.status(400).render("admin/dashboard", {
					pageTitle: "Panel administratora",
					stats: await this.adminService.stats(),
					equipment: await this.equipmentRepository.listAll(),
					formError: error.message
				});
				return;
			}
			next(error);
		}
	}

	async removeBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			await this.adminService.removeBlock(id);
			res.redirect("/admin");
		} catch (error) {
			next(error);
		}
	}

	async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			await this.adminService.cancelBooking(id);
			if (this.expectsJson(req)) {
				res.json({ success: true, booking: { id, status: "cancelled" } });
				return;
			}
			res.redirect("/admin/bookings");
		} catch (error) {
			if (this.expectsJson(req)) {
				const status = error instanceof AppError ? error.statusCode : 500;
				res.status(status).json({
					success: false,
					message: error instanceof Error ? error.message : "Błąd systemu"
				});
				return;
			}
			next(error);
		}
	}

	private expectsJson(req: Request): boolean {
		const acceptHeader = Array.isArray(req.headers.accept) ? req.headers.accept.join(",") : (req.headers.accept ?? "");
		if (acceptHeader.includes("application/json")) {
			return true;
		}
		const contentTypeHeader = req.headers["content-type"];
		const contentType = Array.isArray(contentTypeHeader) ? contentTypeHeader.join(",") : (contentTypeHeader ?? "");
		return contentType.includes("application/json");
	}

	private toOptionalNumber(value: unknown): number | undefined {
		if (value === undefined || value === null || value === "") {
			return undefined;
		}
		if (typeof value === "number") {
			return Number.isFinite(value) ? value : undefined;
		}
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (!trimmed) {
				return undefined;
			}
			const parsed = Number(trimmed);
			return Number.isFinite(parsed) ? parsed : undefined;
		}
		return undefined;
	}

	private toOptionalBoolean(value: unknown): boolean | undefined {
		if (value === undefined || value === null || value === "") {
			return undefined;
		}
		if (typeof value === "boolean") {
			return value;
		}
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (normalized === "true") {
				return true;
			}
			if (normalized === "false") {
				return false;
			}
		}
		return undefined;
	}

	async listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const filters = {
				equipmentId: req.query.equipment ? Number(req.query.equipment) : undefined,
				dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
				dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
				student: req.query.student ? String(req.query.student) : undefined,
				sort: (req.query.sort as "date" | "student" | "equipment") ?? "date",
				order: (req.query.order as "asc" | "desc") ?? "desc",
				page: req.query.page ? Number(req.query.page) : 1,
				pageSize: 20
			};
			const { data, total } = await this.adminService.listBookings(filters);
			const totalPages = Math.ceil(total / (filters.pageSize ?? 20));
			res.render("admin/bookingOverseer", {
				pageTitle: "Nadzór rezerwacji",
				bookings: data,
				filters,
				pagination: {
					page: filters.page,
					totalPages,
					total
				},
				equipment: await this.equipmentRepository.listAll()
			});
		} catch (error) {
			next(error);
		}
	}

	async exportCsv(_req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const target = path.join(__dirname, "../../tmp", `export-${Date.now()}.csv`);
			const filePath = await this.adminService.exportCsv(target);
			res.download(filePath, "rezerwacje.csv");
		} catch (error) {
			next(error);
		}
	}
}
