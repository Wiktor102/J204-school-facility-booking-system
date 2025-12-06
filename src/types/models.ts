export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export enum BookingStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
}

export interface Equipment {
  id: number;
  name: string;
  location: string;
  iconName: string;
  accentColor: string;
  isActive: boolean;
  dailyStartHour: number;
  dailyEndHour: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
}

export interface Booking {
  id: number;
  userId: number;
  equipmentId: number;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: Date;
  cancelledAt?: Date;
}

export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookerId?: number;
  bookerName?: string;
  isOwnBooking: boolean;
  isCompleted?: boolean;
}

export interface WeekView {
  weekStart: Date;
  weekEnd: Date;
  days: DaySlots[];
}

export interface DaySlots {
  date: Date;
  dayName: string;
  slots: TimeSlot[];
}
