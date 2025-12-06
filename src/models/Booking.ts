import { BookingStatus, type Booking } from '../types/models.js';

export interface BookingRow {
  id: number;
  user_id: number;
  equipment_id: number;
  booking_date: Date;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: Date;
  cancelled_at: Date | null;
}

export function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    userId: row.user_id,
    equipmentId: row.equipment_id,
    bookingDate: row.booking_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at ?? undefined,
  };
}
