import session from "express-session";
import type { Pool, RowDataPacket } from "mysql2/promise";

interface StoredSessionRow extends RowDataPacket {
	session_id: string;
	data: string;
	expires_at: Date;
}

export class MySQLSessionStore extends session.Store {
	private pool: Pool;
	private tableName = "sessions";

	constructor(pool: Pool) {
		super();
		this.pool = pool;
		void this.initialize();
	}

	private async initialize(): Promise<void> {
		const createTable = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        session_id VARCHAR(255) PRIMARY KEY,
        data JSON NOT NULL,
        expires_at DATETIME NOT NULL,
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB;
    `;
		await this.pool.query(createTable);
		await this.cleanupExpired();
	}

	private async cleanupExpired(): Promise<void> {
		await this.pool.query(`DELETE FROM ${this.tableName} WHERE expires_at < NOW()`);
	}

	override async get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void): Promise<void> {
		try {
			const [rows] = await this.pool.query<StoredSessionRow[]>(
				`SELECT data, expires_at FROM ${this.tableName} WHERE session_id = ? LIMIT 1`,
				[sid]
			);
			if (!rows || rows.length === 0) {
				callback(null, null);
				return;
			}
			const row = rows[0];
			if (new Date(row.expires_at) < new Date()) {
				await this.destroy(sid, () => undefined);
				callback(null, null);
				return;
			}
			const data = JSON.parse(row.data) as session.SessionData;
			callback(null, data);
		} catch (error) {
			callback(error);
		}
	}

	override async set(sid: string, sess: session.SessionData, callback: (err?: unknown) => void): Promise<void> {
		try {
			const expiresAt = new Date(Date.now() + (sess.cookie?.maxAge ?? 86400000));
			await this.pool.query(`REPLACE INTO ${this.tableName} (session_id, data, expires_at) VALUES (?, ?, ?)`, [
				sid,
				JSON.stringify(sess),
				expiresAt
			]);
			callback();
		} catch (error) {
			callback(error);
		}
	}

	override async destroy(sid: string, callback: (err?: unknown) => void): Promise<void> {
		try {
			await this.pool.query(`DELETE FROM ${this.tableName} WHERE session_id = ?`, [sid]);
			callback();
		} catch (error) {
			callback(error);
		}
	}

	override async touch(sid: string, sess: session.SessionData, callback: (err?: unknown) => void): Promise<void> {
		try {
			const expiresAt = new Date(Date.now() + (sess.cookie?.maxAge ?? 86400000));
			await this.pool.query(`UPDATE ${this.tableName} SET expires_at = ?, data = ? WHERE session_id = ?`, [
				expiresAt,
				JSON.stringify(sess),
				sid
			]);
			callback();
		} catch (error) {
			callback(error);
		}
	}
}
