import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/environment.js";
import { getPool } from "./config/database.js";
import { registerMiddleware } from "./middleware/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { registerRoutes } from "./routes/index.js";
import { UserRepository } from "./repositories/UserRepository.js";
import { EquipmentRepository } from "./repositories/EquipmentRepository.js";
import { BookingRepository } from "./repositories/BookingRepository.js";
import { AuthService } from "./services/AuthService.js";
import { BookingService } from "./services/BookingService.js";
import { AdminService } from "./services/AdminService.js";
import { AuthController } from "./controllers/authController.js";
import { DashboardController } from "./controllers/dashboardController.js";
import { BookingController } from "./controllers/bookingController.js";
import { AdminController } from "./controllers/adminController.js";

process.env.TZ = env.tz;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
	const app = express();
	const pool = getPool();

	const userRepository = new UserRepository(pool);
	const equipmentRepository = new EquipmentRepository(pool);
	const bookingRepository = new BookingRepository(pool);

	const authService = new AuthService(userRepository);
	const bookingService = new BookingService(bookingRepository, equipmentRepository);
	const adminService = new AdminService(bookingRepository, equipmentRepository);

	const controllers = {
		auth: new AuthController(authService),
		dashboard: new DashboardController(equipmentRepository, bookingService),
		booking: new BookingController(bookingService, equipmentRepository),
		admin: new AdminController(adminService, equipmentRepository)
	};

	app.set("view engine", "ejs");
	app.set("views", path.join(__dirname, "../views"));

	await registerMiddleware(app, authService);

	registerRoutes(app, controllers);

	app.use(errorHandler);

	app.listen(env.port, () => {
		console.log(`Serwer słucha na porcie ${env.port}`);
	});
}

void bootstrap();
