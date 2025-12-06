import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { mapBooking, type BookingRow } from '../models/Booking.js';
import type { Booking, BookingStatus } from '../types/models.js';

interface BlockedSlotRow extends RowDataPacket {
  id: number;
  equipment_id: number;
  block_date: Date;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_by: number;
  created_at: Date;
}

export interface BookingWithNames extends Booking {
  userName: string;
  equipmentName: string;
}

export class BookingRepository {
  constructor(private pool: Pool) {}

  async create(data: {
    userId: number;
    equipmentId: number;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status?: BookingStatus;
  }): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO bookings (user_id, equipment_id, booking_date, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.equipmentId,
        data.bookingDate,
        data.startTime,
        data.endTime,
        data.status ?? 'active',
      ],
    );
    return result.insertId;
  }

  async cancel(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?`,
      [id],
    );
  }

  async findById(id: number): Promise<Booking | null> {
    const [rows] = await this.pool.query<(BookingRow & RowDataPacket)[]>(
      'SELECT * FROM bookings WHERE id = ? LIMIT 1',
      [id],
    );
    if (!rows.length) {
      return null;
    }
    return mapBooking(rows[0]);
  }

  async findActiveByUserAndEquipment(userId: number, equipmentId: number): Promise<Booking | null> {
    const [rows] = await this.pool.query<(BookingRow & RowDataPacket)[]>(
      `SELECT * FROM bookings WHERE user_id = ? AND equipment_id = ? AND status = 'active' LIMIT 1`,
      [userId, equipmentId],
    );
    return rows.length ? mapBooking(rows[0]) : null;
  }

  async findByEquipmentAndDate(equipmentId: number, date: string): Promise<Booking[]> {
    const [rows] = await this.pool.query<(BookingRow & RowDataPacket)[]>(
      `SELECT * FROM bookings WHERE equipment_id = ? AND booking_date = ? AND status = 'active'`,
      [equipmentId, date],
    );
    return rows.map(mapBooking);
  }

  async findWeekBookings(equipmentId: number, startDate: string, endDate: string): Promise<Booking[]> {
    const [rows] = await this.pool.query<(BookingRow & RowDataPacket)[]>(
      `SELECT * FROM bookings WHERE equipment_id = ? AND booking_date BETWEEN ? AND ?`,
      [equipmentId, startDate, endDate],
    );
    return rows.map(mapBooking);
  }

  async listUserBookings(userId: number): Promise<BookingWithNames[]> {
    const [rows] = await this.pool.query<(BookingRow & RowDataPacket & { equipment_name: string })[]>(
      `SELECT b.*, e.name as equipment_name
       FROM bookings b
       JOIN equipment e ON e.id = b.equipment_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC, b.start_time DESC`,
      [userId],
    );
    return rows.map((row) => ({ ...mapBooking(row), equipmentName: row.equipment_name, userName: '' }));
  }

  async recentActivity(limit = 5): Promise<BookingWithNames[]> {
    const [rows] = await this.pool.query<
      (BookingRow &
        RowDataPacket & {
          equipment_name: string;
          user_name: string;
        })[]
    >(
      `SELECT b.*, e.name as equipment_name, CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM bookings b
       JOIN equipment e ON e.id = b.equipment_id
       JOIN users u ON u.id = b.user_id
       WHERE b.status = 'active'
       ORDER BY b.created_at DESC
       LIMIT ?`,
      [limit],
    );
    return rows.map((row) => ({
      ...mapBooking(row),
      equipmentName: row.equipment_name,
      userName: row.user_name,
    }));
  }

  async listAllWithFilters(params: {
    equipmentId?: number;
    dateFrom?: string;
    dateTo?: string;
    student?: string;
    sort?: 'date' | 'student' | 'equipment';
    order?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): Promise<{ bookings: BookingWithNames[]; total: number }> {
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (params.equipmentId) {
      conditions.push('b.equipment_id = ?');
      values.push(params.equipmentId);
    }
    if (params.dateFrom) {
      conditions.push('b.booking_date >= ?');
      values.push(params.dateFrom);
    }
    if (params.dateTo) {
      conditions.push('b.booking_date <= ?');
      values.push(params.dateTo);
    }
    if (params.student) {
      conditions.push('(u.first_name LIKE ? OR u.email LIKE ?)');
      const like = `%${params.student}%`;
      values.push(like, like);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortMap: Record<string, string> = {
      date: 'b.booking_date',
      student: 'u.first_name',
      equipment: 'e.name',
    };
    const orderBy = sortMap[params.sort ?? 'date'] ?? 'b.booking_date';
    const order = params.order === 'asc' ? 'ASC' : 'DESC';
    const pageSize = params.pageSize ?? 20;
    const page = params.page && params.page > 0 ? params.page : 1;
    const offset = (page - 1) * pageSize;

    const [totalRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN equipment e ON e.id = b.equipment_id
       ${whereClause}`,
      values,
    );
    const total = Number((totalRows[0] as RowDataPacket).count ?? 0);

    const [rows] = await this.pool.query<
      (BookingRow &
        RowDataPacket & {
          equipment_name: string;
          user_name: string;
        })[]
    >(
      `SELECT b.*, e.name as equipment_name, CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN equipment e ON e.id = b.equipment_id
       ${whereClause}
       ORDER BY ${orderBy} ${order}
       LIMIT ? OFFSET ?`,
      [...values, pageSize, offset],
    );

    const bookings = rows.map((row) => ({
      ...mapBooking(row),
      equipmentName: row.equipment_name,
      userName: row.user_name,
    }));

    return { bookings, total };
  }

  async getBlockedSlots(equipmentId: number, date: string): Promise<BlockedSlotRow[]> {
    const [rows] = await this.pool.query<BlockedSlotRow[]>(
      `SELECT * FROM blocked_slots WHERE equipment_id = ? AND block_date = ?`,
      [equipmentId, date],
    );
    return rows;
  }

  async createBlockedSlot(data: {
    equipmentId: number;
    blockDate: string;
    startTime: string;
    endTime: string;
    reason?: string;
    createdBy: number;
  }): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO blocked_slots (equipment_id, block_date, start_time, end_time, reason, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.equipmentId, data.blockDate, data.startTime, data.endTime, data.reason ?? null, data.createdBy],
    );
    return result.insertId;
  }

  async deleteBlockedSlot(id: number): Promise<void> {
    await this.pool.query('DELETE FROM blocked_slots WHERE id = ?', [id]);
  }
}
