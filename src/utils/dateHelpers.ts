import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { pl } from "date-fns/locale";

export function getWeekRange(date: Date): { start: Date; end: Date } {
	const start = startOfWeek(date, { weekStartsOn: 1 });
	const end = endOfWeek(date, { weekStartsOn: 1 });
	return { start, end };
}

export function formatDate(date: Date, pattern = "yyyy-MM-dd"): string {
	return format(date, pattern, { locale: pl });
}

export function getDayName(date: Date): string {
	return format(date, "EEEE", { locale: pl });
}

export function buildWeekDays(start: Date, end: Date): Date[] {
	return eachDayOfInterval({ start, end });
}

export function toDate(date: string | Date): Date {
	return typeof date === "string" ? parseISO(date) : date;
}

export function isPast(date: Date): boolean {
	return isBefore(date, new Date());
}

export function isSameOrAfter(a: Date, b: Date): boolean {
	return isAfter(a, b) || isEqual(a, b);
}

export function isSameOrBefore(a: Date, b: Date): boolean {
	return isBefore(a, b) || isEqual(a, b);
}

export function addDaysSafe(date: Date, days: number): Date {
	return addDays(date, days);
}
