import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import logger from "./lib/logger";
import walletRoutes from "./routes/wallet.routes";
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middleware/errorHandler";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Security & Middlewares
app.use(helmet());
app.use(cors());
app.use(
	morgan(process.env.NODE_ENV === "development" ? "dev" : "combined", {
		stream: { write: (message: string) => logger.info(message.trim()) },
	}),
);
app.use(express.json());

// Routes
app.use("/api/wallet", walletRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/api/health", (req, res) => {
	res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// Global Error Handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
	logger.info(`🚀 Wallet Service running on port ${PORT}`);
	logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
const shutdown = () => {
	logger.info("Shutdown signal received. Closing server...");
	server.close(() => {
		logger.info("Server closed.");
		process.exit(0);
	});
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;
