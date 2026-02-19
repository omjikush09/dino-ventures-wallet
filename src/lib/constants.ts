/**
 * System constants for the wallet service
 */

// Well-known system account identifiers
export const SYSTEM_ACCOUNTS = {
	TREASURY: "treasury@system.dino-ventures.local",
	REVENUE: "revenue@system.dino-ventures.local",
} as const;

// Asset type codes
export const ASSET_CODES = {
	GOLD: "GOLD",
	DIAMONDS: "DIAMONDS",
	LOYALTY: "LOYALTY",
} as const;

// Maximum retry attempts for concurrent transactions
export const MAX_TRANSACTION_RETRIES = 3;

// Lock timeout in milliseconds
export const LOCK_TIMEOUT_MS = 5000;
