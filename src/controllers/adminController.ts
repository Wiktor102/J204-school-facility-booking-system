import type { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { AdminService } from "../services/AdminService.js";
import { EquipmentRepository } from "../repositories/EquipmentRepository.js";
import { AppError } from "../utils/errors.js";
import { validateOpeningHours, validateDurationMinutes, validate } from "../utils/validators.js";
import { BaseController, type FormErrorContext } from "./BaseController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AdminController extends BaseController {
	constructor(
		private adminService: AdminService,
		private equipmentRepository: EquipmentRepository
	) {
		super();
	}

	/**
	 * Creates the form error context for admin dashboard forms.
	 * Used when validation errors occur in equipment or blockade creation.
	 */
	private getDashboardFormContext(): FormErrorContext {
		return {
			view: "admin/dashboard",
			pageTitle: "Panel administratora",
			getViewData: async () => ({
				stats: await this.adminService.stats(),
				equipment: await this.equipmentRepository.listAll()
			})
		};
	}

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
			const dailyStartHour = Number(req.body?.dailyStartHour ?? 14);
			const dailyEndHour = Number(req.body?.dailyEndHour ?? 22);
			const minDurationMinutes = Number(req.body?.minDurationMinutes ?? 60);
			const maxDurationMinutes = Number(req.body?.maxDurationMinutes ?? 120);

			// Validate opening hours
			const hoursValidation = validateOpeningHours(dailyStartHour, dailyEndHour);
			if (hoursValidation) {
				const validation = validate([hoursValidation]);
				throw new AppError(validation.errors[0].message, 400);
			}

			// Validate duration
			const durationValidation = validateDurationMinutes(minDurationMinutes, maxDurationMinutes);
			if (durationValidation) {
				const validation = validate([durationValidation]);
				throw new AppError(validation.errors[0].message, 400);
			}

			const payload = {
				name: req.body?.name,
				iconName: req.body?.iconName,
				accentColor: req.body?.accentColor,
				dailyStartHour,
				dailyEndHour,
				minDurationMinutes,
				maxDurationMinutes
			};
			await this.adminService.addEquipment(payload);
			res.redirect("/admin");
		} catch (error) {
			const handled = await this.handleError(error, req, res, this.getDashboardFormContext());
			if (!handled) next(error);
		}
	}

	async updateEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const dailyStartHour = this.toOptionalNumber(req.body?.dailyStartHour);
			const dailyEndHour = this.toOptionalNumber(req.body?.dailyEndHour);
			const minDurationMinutes = this.toOptionalNumber(req.body?.minDurationMinutes);
			const maxDurationMinutes = this.toOptionalNumber(req.body?.maxDurationMinutes);

			// Validate opening hours if both are provided
			if (dailyStartHour !== undefined && dailyEndHour !== undefined) {
				const hoursValidation = validateOpeningHours(dailyStartHour, dailyEndHour);
				if (hoursValidation) {
					const validation = validate([hoursValidation]);
					throw new AppError(validation.errors[0].message, 400);
				}
			}

			// Validate duration if both are provided
			if (minDurationMinutes !== undefined && maxDurationMinutes !== undefined) {
				const durationValidation = validateDurationMinutes(minDurationMinutes, maxDurationMinutes);
				if (durationValidation) {
					const validation = validate([durationValidation]);
					throw new AppError(validation.errors[0].message, 400);
				}
			}

			const updated = await this.adminService.updateEquipment(id, {
				name: req.body?.name,
				iconName: req.body?.iconName,
				accentColor: req.body?.accentColor,
				dailyStartHour,
				dailyEndHour,
				minDurationMinutes,
				maxDurationMinutes,
				isActive: this.toOptionalBoolean(req.body?.isActive)
			});
			if (!updated) {
				if (this.expectsJson(req)) {
					res.status(404).json({ success: false, message: "Sprzęt nie istnieje." });
					return;
				}
				throw new AppError("Sprzęt nie istnieje.", 404);
			}
			if (this.expectsJson(req)) {
				res.json({ success: true, equipment: updated });
				return;
			}
			res.redirect("/admin");
		} catch (error) {
			const handled = await this.handleError(error, req, res, this.getDashboardFormContext());
			if (!handled) next(error);
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
			const handled = await this.handleError(error, req, res, this.getDashboardFormContext());
			if (!handled) next(error);
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
			const handled = await this.handleError(error, req, res);
			if (!handled) next(error);
		}
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
