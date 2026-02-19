/**
 * Custom error classes for the wallet service
 */

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly code: string;
	public readonly isOperational: boolean;

	constructor(
		message: string,
		statusCode: number = 500,
		code: string = "INTERNAL_ERROR",
		isOperational: boolean = true,
	) {
		super(message);
		this.statusCode = statusCode;
		this.code = code;
		this.isOperational = isOperational;
		Object.setPrototypeOf(this, AppError.prototype);
	}
}

export class InsufficientBalanceError extends AppError {
	constructor(walletId: string, requested: bigint, available: bigint) {
		super(
			`Insufficient balance in wallet ${walletId}. Requested: ${requested}, Available: ${available}`,
			400,
			"INSUFFICIENT_BALANCE",
		);
	}
}

export class DuplicateTransactionError extends AppError {
	constructor(idempotencyKey: string, existingTransactionId: string) {
		super(
			`Transaction with idempotency key '${idempotencyKey}' already exists (id: ${existingTransactionId})`,
			409,
			"DUPLICATE_TRANSACTION",
		);
	}
}

export class WalletNotFoundError extends AppError {
	constructor(identifier: string) {
		super(`Wallet not found: ${identifier}`, 404, "WALLET_NOT_FOUND");
	}
}

export class AssetNotFoundError extends AppError {
	constructor(identifier: string) {
		super(`Asset type not found: ${identifier}`, 404, "ASSET_NOT_FOUND");
	}
}

export class UserNotFoundError extends AppError {
	constructor(identifier: string) {
		super(`User not found: ${identifier}`, 404, "USER_NOT_FOUND");
	}
}

export class ConcurrencyError extends AppError {
	constructor() {
		super(
			"Transaction failed due to concurrent modification. Please retry.",
			409,
			"CONCURRENCY_CONFLICT",
		);
	}
}
