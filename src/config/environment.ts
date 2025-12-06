import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
	const value = process.env[name] ?? fallback;
	if (!value) {
		throw new Error(`Missing environment variable: ${name}`);
	}
	return value;
}

export const env = {
	nodeEnv: process.env.NODE_ENV ?? "development",
	port: Number(process.env.PORT ?? 3000),
	db: {
		host: requireEnv("DB_HOST", "localhost"),
		port: Number(process.env.DB_PORT ?? 3306),
		name: requireEnv("DB_NAME", "facility_booking"),
		user: requireEnv("DB_USER", "booking_user"),
		password: requireEnv("DB_PASSWORD", "")
	},
	session: {
		secret: requireEnv("SESSION_SECRET", "change_me"),
		maxAge: Number(process.env.SESSION_MAX_AGE ?? 86400000)
	},
	tz: process.env.TZ ?? "Europe/Warsaw"
};
