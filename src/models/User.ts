import { UserRole, type User } from "../types/models.js";

export interface UserRow {
	id: number;
	email: string;
	password_hash: string;
	first_name: string;
	last_name: string;
	role: UserRole;
	created_at: Date;
}

export function mapUser(row: UserRow): User {
	return {
		id: row.id,
		email: row.email,
		firstName: row.first_name,
		lastName: row.last_name,
		role: row.role,
		createdAt: row.created_at
	};
}
