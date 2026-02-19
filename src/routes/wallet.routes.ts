import { Router } from "express";
import {
	topUpRequestSchema,
	bonusRequestSchema,
	purchaseRequestSchema,
	issueIdempotencyKeyRequestSchema,
	balanceSchema,
	transactionHistoryRequestSchema,
	transactionByIdSchema,
} from "../schemas/wallet.schema";
import { validate } from "../middleware/validate";

import * as walletController from "../controllers/wallet.controller";

const router: Router = Router();

// ─── POST /api/wallet/idempotency-key ──────────────────────────────────────────
// Client asks system to issue a new idempotency key for a specific operation.
router.post(
	"/idempotency-key",
	validate(issueIdempotencyKeyRequestSchema),
	walletController.issueIdempotencyKey,
);

// ─── POST /api/wallet/topup ─────────────────────────────────────────────────────
// Credits a user's wallet (simulates purchasing credits with real money)
router.post(
	"/topup",
	validate(topUpRequestSchema),
	walletController.topUp,
);

// ─── POST /api/wallet/bonus ─────────────────────────────────────────────────────
// Issues free credits to a user (referral bonus, rewards, etc.)
router.post(
	"/bonus",
	validate(bonusRequestSchema),
	walletController.bonus,
);

// ─── POST /api/wallet/purchase ──────────────────────────────────────────────────
// Spends credits from a user's wallet to buy an in-app item
router.post(
	"/purchase",
	validate(purchaseRequestSchema),
	walletController.purchase,
);

// ─── GET /api/wallet/balance/:userId ────────────────────────────────────────────
// Retrieves all wallet balances for a user, optionally filtered by asset
router.get(
	"/balance/:userId",
	validate(balanceSchema),
	walletController.getBalance,
);

// ─── GET /api/wallet/transactions ───────────────────────────────────────────────
// Retrieves transaction history with pagination
router.get(
	"/transactions",
	validate(transactionHistoryRequestSchema),
	walletController.getTransactionHistory,
);

// ─── GET /api/wallet/transactions/:id ───────────────────────────────────────────
// Retrieves a single transaction by ID with full journal entries
router.get(
	"/transactions/:id",
	validate(transactionByIdSchema),
	walletController.getTransactionById,
);

export default router;
