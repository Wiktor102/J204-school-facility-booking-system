import type { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { mapEquipment, type EquipmentRow } from "../models/Equipment.js";
import type { Equipment } from "../types/models.js";

export class EquipmentRepository {
	constructor(private pool: Pool) {}

	async listActive(): Promise<Equipment[]> {
		const [rows] = await this.pool.query<(EquipmentRow & RowDataPacket)[]>(
			"SELECT * FROM equipment WHERE is_active = 1 ORDER BY name ASC"
		);
		return rows.map(mapEquipment);
	}

	async listAll(): Promise<Equipment[]> {
		const [rows] = await this.pool.query<(EquipmentRow & RowDataPacket)[]>("SELECT * FROM equipment ORDER BY name ASC");
		return rows.map(mapEquipment);
	}

	async findById(id: number): Promise<Equipment | null> {
		const [rows] = await this.pool.query<(EquipmentRow & RowDataPacket)[]>(
			"SELECT * FROM equipment WHERE id = ? LIMIT 1",
			[id]
		);
		if (!rows.length) {
			return null;
		}
		return mapEquipment(rows[0]);
	}

	async create(data: {
		name: string;
		iconName: string;
		accentColor: string;
		dailyStartHour: number;
		dailyEndHour: number;
		minDurationMinutes: number;
		maxDurationMinutes: number;
	}): Promise<number> {
		const [result] = await this.pool.query<ResultSetHeader>(
			`INSERT INTO equipment (name, icon_name, accent_color, daily_start_hour, daily_end_hour, min_duration_minutes, max_duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				data.name,
				data.iconName,
				data.accentColor,
				data.dailyStartHour,
				data.dailyEndHour,
				data.minDurationMinutes,
				data.maxDurationMinutes
			]
		);
		return result.insertId;
	}

	async update(id: number, fields: Partial<Equipment>): Promise<void> {
		const allowed: Record<string, unknown> = {
			name: fields.name,
			icon_name: fields.iconName,
			accent_color: fields.accentColor,
			daily_start_hour: fields.dailyStartHour,
			daily_end_hour: fields.dailyEndHour,
			min_duration_minutes: fields.minDurationMinutes,
			max_duration_minutes: fields.maxDurationMinutes,
			is_active: fields.isActive !== undefined ? (fields.isActive ? 1 : 0) : undefined
		};

		const entries = Object.entries(allowed).filter(([, value]) => value !== undefined);
		if (!entries.length) {
			return;
		}

		const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
		const params = entries.map(([, value]) => value as unknown);
		params.push(id);

		await this.pool.query(`UPDATE equipment SET ${setClause} WHERE id = ?`, params);
	}

	async toggleAvailability(id: number, isActive: boolean): Promise<void> {
		await this.pool.query("UPDATE equipment SET is_active = ? WHERE id = ?", [isActive ? 1 : 0, id]);
	}
}
