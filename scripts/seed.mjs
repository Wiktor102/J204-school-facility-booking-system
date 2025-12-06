import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT ?? 3306),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	// Allow executing multiple statements from schema.sql
	multipleStatements: true
});

async function seedDatabase() {
	const connection = await pool.getConnection();

	try {
		// Run the SQL schema before any seed operations
		try {
			console.log("🔧 Applying schema from scripts/schema.sql...");
			const schemaPath = new URL("./schema.sql", import.meta.url);
			const schemaSql = await fs.readFile(schemaPath, "utf8");
			// Execute the complete schema SQL file, allowing multiple statements
			await connection.query(schemaSql);
			console.log("✅ Schema applied successfully.");
		} catch (schemaError) {
			console.error("✗ Failed to apply schema.sql:", schemaError);
			throw schemaError;
		}

		const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
		const studentPasswordHash = await bcrypt.hash("Student123!", 12);

		await connection.query(
			`INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE email = email`,
			["admin@szkola.pl", adminPasswordHash, "Administrator", "Systemu", "admin"]
		);

		await connection.query(
			`INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE email = email`,
			["student@example.com", studentPasswordHash, "Uczeń", "Przykładowy", "student"]
		);

		await connection.query(
			`INSERT INTO equipment (name, location, icon_name, accent_color, daily_start_hour, daily_end_hour, min_duration_minutes, max_duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        location = VALUES(location), 
        icon_name = VALUES(icon_name), 
        accent_color = VALUES(accent_color)`,
			["Stół bilardowy", "Świetlica uczniowska, 2. piętro", "pool-table", "#00d9ff", 14, 22, 60, 120]
		);

		await connection.query(
			`INSERT INTO equipment (name, location, icon_name, accent_color, daily_start_hour, daily_end_hour, min_duration_minutes, max_duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        location = VALUES(location), 
        icon_name = VALUES(icon_name), 
        accent_color = VALUES(accent_color)`,
			["Kącik gamingowy PS5", "Świetlica uczniowska, 2. piętro", "gamepad", "#39ff14", 14, 22, 60, 180]
		);

		console.log("✓ Baza została poprawnie zasilona danymi.");
		process.exit(0);
	} catch (error) {
		console.error("✗ Błąd podczas zasilania bazy:", error);
		process.exit(1);
	} finally {
		connection.release();
		await pool.end();
	}
}

seedDatabase();
