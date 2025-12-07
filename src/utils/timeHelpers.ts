export function normalizeTimeString(time: string): string {
	if (!time) return time;

	const parts = String(time).split(":");
	if (parts.length < 2) return time;
	const h = String(Number(parts[0])).padStart(2, "0");
	const m = String(Number(parts[1])).padStart(2, "0");
	return `${h}:${m}`;
}
