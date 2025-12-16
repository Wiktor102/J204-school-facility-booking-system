import type { Equipment } from "../types/models.js";

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

export function validateEmail(email: string): ValidationError | null {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!email || !emailRegex.test(email)) {
		return {
			field: "email",
			message: "Podaj prawidłowy adres e-mail"
		};
	}
	return null;
}

export function validatePassword(password: string): ValidationError | null {
	if (!password || password.length < 8) {
		return {
			field: "password",
			message: "Hasło musi mieć co najmniej 8 znaków"
		};
	}
	if (!/[A-Z]/.test(password)) {
		return {
			field: "password",
			message: "Hasło musi zawierać co najmniej jedną wielką literę"
		};
	}
	if (!/[0-9]/.test(password)) {
		return {
			field: "password",
			message: "Hasło musi zawierać co najmniej jedną cyfrę"
		};
	}
	return null;
}

export function validateName(name: string, field: string): ValidationError | null {
	if (!name || name.trim().length === 0) {
		return {
			field,
			message: `Pole "${field}" nie może być puste`
		};
	}
	if (name.length > 100) {
		return {
			field,
			message: `Pole "${field}" może zawierać maksymalnie 100 znaków`
		};
	}
	return null;
}

export function validateBookingDuration(startTime: string, endTime: string, equipment: Equipment): ValidationError | null {
	const [startHours, startMinutes] = startTime.split(":").map(Number);
	const [endHours, endMinutes] = endTime.split(":").map(Number);

	const startDate = new Date();
	startDate.setHours(startHours, startMinutes, 0, 0);
	const endDate = new Date();
	endDate.setHours(endHours, endMinutes, 0, 0);

	const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

	if (durationMinutes < equipment.minDurationMinutes) {
		return {
			field: "duration",
			message: `Minimalna długość rezerwacji to ${equipment.minDurationMinutes} minut`
		};
	}

	if (durationMinutes > equipment.maxDurationMinutes) {
		return {
			field: "duration",
			message: `Maksymalna długość rezerwacji to ${equipment.maxDurationMinutes} minut`
		};
	}

	return null;
}

export function validateBookingTime(startTime: string, endTime: string, equipment: Equipment): ValidationError | null {
	const [startHours] = startTime.split(":").map(Number);
	const [endHours] = endTime.split(":").map(Number);

	if (startHours < equipment.dailyStartHour || startHours >= equipment.dailyEndHour) {
		return {
			field: "startTime",
			message: `Sprzęt jest dostępny od ${equipment.dailyStartHour}:00 do ${equipment.dailyEndHour}:00`
		};
	}

	if (endHours < equipment.dailyStartHour || endHours > equipment.dailyEndHour) {
		return {
			field: "endTime",
			message: `Rezerwacja musi kończyć się do ${equipment.dailyEndHour}:00`
		};
	}

	return null;
}

export function validateOpeningHours(startHour: number, endHour: number): ValidationError | null {
	if (startHour < 0) {
		return {
			field: "dailyStartHour",
			message: "Godzina otwarcia nie może być ujemna"
		};
	}

	if (endHour < 0) {
		return {
			field: "dailyEndHour",
			message: "Godzina zamknięcia nie może być ujemna"
		};
	}

	if (startHour > 23) {
		return {
			field: "dailyStartHour",
			message: "Godzina otwarcia nie może być większa niż 23"
		};
	}

	if (endHour > 23) {
		return {
			field: "dailyEndHour",
			message: "Godzina zamknięcia nie może być większa niż 23"
		};
	}

	if (startHour >= endHour) {
		return {
			field: "dailyStartHour",
			message: "Godzina otwarcia musi być wcześniejsza niż godzina zamknięcia"
		};
	}

	return null;
}

export function validateDurationMinutes(minDuration: number, maxDuration: number): ValidationError | null {
	if (minDuration < 1) {
		return {
			field: "minDurationMinutes",
			message: "Minimalny czas rezerwacji musi być większy niż 0"
		};
	}

	if (maxDuration < 1) {
		return {
			field: "maxDurationMinutes",
			message: "Maksymalny czas rezerwacji musi być większy niż 0"
		};
	}

	if (minDuration > maxDuration) {
		return {
			field: "minDurationMinutes",
			message: "Minimalny czas nie może być większy niż maksymalny"
		};
	}

	return null;
}

export function validate(validations: (ValidationError | null)[]): ValidationResult {
	const errors = validations.filter((error): error is ValidationError => error !== null);
	return {
		isValid: errors.length === 0,
		errors
	};
}
