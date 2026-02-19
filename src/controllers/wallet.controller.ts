import { Response } from "express";
import logger from "../lib/logger";
import * as walletService from "../services/wallet.service";
import type { RequestFromSchema } from "../types/request-from-schema";
import type {
	TopUpRequestSchema,
	BonusRequestSchema,
	PurchaseRequestSchema,
	BalanceRequestSchema,
	TransactionHistoryRequestSchema,
	TransactionByIdRequestSchema,
	IssueIdempotencyKeyRequestSchema,
} from "../schemas/wallet.schema";

export async function topUp(
	req: RequestFromSchema<TopUpRequestSchema>,
	res: Response,
): Promise<void> {
	const input = req.body;
	const idempotencyKey = req.headers["idempotency-key"] as string;
	logger.info("Top-up request received", {
		userId: input.userId,
		assetName: input.assetName,
		amount: input.amount,
		idempotencyKey,
	});

	const result = await walletService.topUp(input, idempotencyKey);
	res.status(201).json({ success: true, data: result });
}

export async function bonus(
	req: RequestFromSchema<BonusRequestSchema>,
	res: Response,
): Promise<void> {
	const input = req.body;
	const idempotencyKey = req.headers["idempotency-key"] as string;
	logger.info("Bonus request received", {
		userId: input.userId,
		assetName: input.assetName,
		amount: input.amount,
		idempotencyKey,
	});

	const result = await walletService.issueBonus(input, idempotencyKey);
	res.status(201).json({ success: true, data: result });
}

export async function purchase(
	req: RequestFromSchema<PurchaseRequestSchema>,
	res: Response,
): Promise<void> {
	const input = req.body;
	const idempotencyKey = req.headers["idempotency-key"] as string;
	logger.info("Purchase request received", {
		userId: input.userId,
		assetCode: input.assetName,
		amount: input.amount,
		idempotencyKey,
	});

	const result = await walletService.purchase(input, idempotencyKey);
	res.status(201).json({ success: true, data: result });
}

export async function getBalance(
	req: RequestFromSchema<BalanceRequestSchema>,
	res: Response,
): Promise<void> {
	const { userId } = req.params;
	const assetName =
		typeof req.query.assetName === "string" ? req.query.assetName : undefined;

	const balances = await walletService.getBalance(userId, assetName);
	res.json({ success: true, data: { userId, wallets: balances } });
}

export async function getTransactionHistory(
	req: RequestFromSchema<TransactionHistoryRequestSchema>,
	res: Response,
): Promise<void> {
	const { walletId, type, limit, offset } = req.query;
	const result = await walletService.getTransactionHistory({
		walletId,
		type,
		limit,
		offset,
	});
	res.json({ success: true, data: result });
}

export async function getTransactionById(
	req: RequestFromSchema<TransactionByIdRequestSchema>,
	res: Response,
): Promise<void> {
	const transaction = await walletService.getTransaction(req.params.id);
	if (!transaction) {
		res.status(404).json({
			success: false,
			error: { code: "NOT_FOUND", message: "Transaction not found" },
		});
		return;
	}

	res.json({ success: true, data: transaction });
}

export async function issueIdempotencyKey(
	req: RequestFromSchema<IssueIdempotencyKeyRequestSchema>,
	res: Response,
): Promise<void> {
	const result = await walletService.issueIdempotencyKey()
	res.status(201).json({ success: true, data: result });
}
