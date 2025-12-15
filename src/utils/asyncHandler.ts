import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps an async Express route handler to automatically catch errors and pass them to next().
 * Eliminates the need for try/catch blocks in every controller method.
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.findAll();
 *   res.json(users);
 * }));
 */
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}
