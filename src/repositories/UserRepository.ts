import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { mapUser, type UserRow } from '../models/User.js';
import type { User, UserRole } from '../types/models.js';

export class UserRepository {
  constructor(private pool: Pool) {}

  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const [rows] = await this.pool.query<(UserRow & RowDataPacket)[]>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    if (!rows.length) {
      return null;
    }
    const row = rows[0];
    return {
      ...mapUser(row),
      passwordHash: row.password_hash,
    };
  }

  async findById(id: number): Promise<User | null> {
    const [rows] = await this.pool.query<(UserRow & RowDataPacket)[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    if (!rows.length) {
      return null;
    }
    return mapUser(rows[0]);
  }

  async create(
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    role: UserRole,
  ): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, role],
    );
    return result.insertId;
  }

  async searchStudents(term: string): Promise<User[]> {
    const like = `%${term}%`;
    const [rows] = await this.pool.query<(UserRow & RowDataPacket)[]>(
      `SELECT * FROM users WHERE role = 'student' AND (first_name LIKE ? OR email LIKE ?)`,
      [like, like],
    );
    return rows.map(mapUser);
  }
}
