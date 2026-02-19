import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";
import logger from "../lib/logger";

/**
 * Global error handling middleware.
 * Catches all errors and returns consistent JSON responses.
 */
export function errorHandler(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	// Handle Zod validation errors
	if (err instanceof ZodError) {
		logger.warn("Validation error", { issues: err.issues });
		res.status(400).json({
			success: false,
			error: {
				code: "VALIDATION_ERROR",
				message: "Request validation failed",
				details: err.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
				})),
			},
		});
		return;
	}

	// Handle known application errors
	if (err instanceof AppError) {
		logger.warn("Application error", {
			code: err.code,
			message: err.message,
			statusCode: err.statusCode,
		});
		res.status(err.statusCode).json({
			success: false,
			error: {
				code: err.code,
				message: err.message,
			},
		});
		return;
	}

	// Handle Prisma unique constraint violations (idempotency race condition)
	if ((err as any).code === "P2002") {
		logger.warn("Unique constraint violation — likely idempotency race", {
			message: err.message,
		});
		res.status(409).json({
			success: false,
			error: {
				code: "DUPLICATE_TRANSACTION",
				message:
					"This transaction has already been processed. Please retry to get the result.",
			},
		});
		return;
	}

	// Unknown errors
	logger.error("Unhandled error", { error: err.message, stack: err.stack });
	res.status(500).json({
		success: false,
		error: {
			code: "INTERNAL_ERROR",
			message:
				process.env.NODE_ENV === "production"
					? "An internal error occurred"
					: err.message,
		},
	});
}
