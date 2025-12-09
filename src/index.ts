import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/environment.js";
import { getPool } from "./config/database.js";
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

	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());

	app.use((req, _res, next) => {
		const bodyMethod = typeof req.body?._method === "string" ? req.body._method : undefined;
		const queryMethod = typeof req.query?._method === "string" ? req.query._method : undefined;
		const override = (bodyMethod || queryMethod || "").toUpperCase();
		if (override === "DELETE" || override === "PATCH") {
			req.method = override;
		}
		if (req.body?._method) {
			delete req.body._method;
		}
		next();
	});

	app.use(
		session({
			secret: env.session.secret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				maxAge: env.session.maxAge,
				sameSite: "lax"
			}
		})
	);

	app.use(async (req, _res, next) => {
		try {
			await authService.attachCurrentUser(req);
			next();
		} catch (error) {
			next(error);
		}
	});

	app.use((req, res, next) => {
		res.locals.currentUser = req.currentUser;
		res.locals.year = new Date().getFullYear();
		next();
	});

	app.use(express.static(path.join(__dirname, "../public")));

	registerRoutes(app, controllers);

	app.use(errorHandler);

	app.listen(env.port, () => {
		// eslint-disable-next-line no-console
		console.log(`Serwer słucha na porcie ${env.port}`);
	});
}

void bootstrap();
