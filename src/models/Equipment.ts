import type { Equipment } from '../types/models.js';

export interface EquipmentRow {
  id: number;
  name: string;
  location: string;
  icon_name: string;
  accent_color: string;
  is_active: number;
  daily_start_hour: number;
  daily_end_hour: number;
  min_duration_minutes: number;
  max_duration_minutes: number;
  created_at: Date;
}

export function mapEquipment(row: EquipmentRow): Equipment {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    iconName: row.icon_name,
    accentColor: row.accent_color,
    isActive: !!row.is_active,
    dailyStartHour: row.daily_start_hour,
    dailyEndHour: row.daily_end_hour,
    minDurationMinutes: row.min_duration_minutes,
    maxDurationMinutes: row.max_duration_minutes,
  };
}
