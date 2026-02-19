import winston from "winston";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for development console output
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
	const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
	if (stack) {
		return `${timestamp} [${level}]: ${message}\n${stack}${metaStr}`;
	}
	return `${timestamp} [${level}]: ${message}${metaStr}`;
});

// Create the logger instance
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "info",
	defaultMeta: { service: "dino-wallet" },
	format: combine(
		errors({ stack: true }),
		timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
	),
	transports: [
		// Console transport — colorized in dev, JSON in production
		new winston.transports.Console({
			format:
				process.env.NODE_ENV === "production"
					? combine(json())
					: combine(colorize(), devFormat),
		}),
		// File transport for errors
		new winston.transports.File({
			filename: "logs/error.log",
			level: "error",
			format: combine(json()),
			maxsize: 5_242_880, // 5MB
			maxFiles: 5,
		}),
		// File transport for all logs
		new winston.transports.File({
			filename: "logs/combined.log",
			format: combine(json()),
			maxsize: 5_242_880,
			maxFiles: 5,
		}),
	],
});

export default logger;
