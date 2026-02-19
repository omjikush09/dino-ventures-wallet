import prisma from "../lib/prisma";
import logger from "../lib/logger";
import {
	InsufficientBalanceError,
	AssetNotFoundError,
	AppError,
} from "../lib/errors";
import { MAX_TRANSACTION_RETRIES } from "../lib/constants";
import type {
	TopUpInput,
	BonusInput,
	PurchaseInput,
} from "../schemas/wallet.schema";
import type {
	Currency,
	IdempotencyStatus,
	Prisma,
	TransactionType,
} from "../generated/prisma/client";
import { getUserById } from "./user.service";

type TxClient = Prisma.TransactionClient;

interface TransactionResult {
	ledgerEntryId: string;
	type: TransactionType;
	status: "PROCESSED";
	amount: string;
	assetName: string;
	walletId: string;
	idempotencyKey: string;
	createdAt: Date;
}

interface WalletBalance {
	walletId: string;
	userId: string;
	assetName: string;
	balance: string;
}

async function resolveAsset(assetCode: Currency) {
	const asset = await prisma.assetType.findUnique({
		where: { name: assetCode },
	});
	if (!asset) throw new AssetNotFoundError(assetCode);
	return asset;
}

async function getOrCreateWallet(
	tx: TxClient,
	userId: string,
	assetId: string,
) {
	let wallet = await tx.wallet.findUnique({
		where: { userId_assetId: { userId, assetId } },
	});
	if (!wallet) {
		wallet = await tx.wallet.create({ data: { userId, assetId, balance: 0n } });
		logger.info("Created new wallet", { walletId: wallet.id, userId, assetId });
	}
	return wallet;
}

async function lockWallet(tx: TxClient, walletId: string) {
	const result = await tx.$queryRawUnsafe<
		Array<{ id: string; balance: bigint }>
	>(`SELECT id, balance FROM wallets WHERE id = $1 FOR UPDATE`, walletId);
	return result[0];
}

async function executeWithRetry<T>(
	operation: () => Promise<T>,
	maxRetries: number = MAX_TRANSACTION_RETRIES,
): Promise<T> {
	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error: any) {
			lastError = error;
			const isRetryable =
				error.code === "P2034" ||
				error.message?.includes("deadlock") ||
				error.message?.includes("could not serialize") ||
				error.message?.includes("Lock wait timeout");

			if (isRetryable && attempt < maxRetries) {
				const backoff = Math.min(100 * Math.pow(2, attempt - 1), 2000);
				const jitter = Math.random() * backoff;
				logger.warn(`Transaction retry attempt ${attempt}/${maxRetries}`, {
					error: error.message,
					backoffMs: Math.round(jitter),
				});
				await new Promise((resolve) => setTimeout(resolve, jitter));
				continue;
			}

			throw error;
		}
	}

	throw lastError;
}

async function assertIdempotencyKeyAvailable(
	tx: TxClient,
	idempotencyKey: string,
) {
	const rows = await tx.$queryRawUnsafe<
		Array<{ key: string; status: IdempotencyStatus }>
	>(
		`SELECT key, status FROM idempotency_keys WHERE key = $1 FOR UPDATE`,
		idempotencyKey,
	);

	const row = rows[0];
	if (!row) {
		throw new AppError(
			"Invalid idempotency key",
			400,
			"INVALID_IDEMPOTENCY_KEY",
		);
	}
	if (row.status === "PROCESSED") {
		throw new AppError(
			"Idempotency key has already been used",
			409,
			"IDEMPOTENCY_KEY_ALREADY_USED",
		);
	}
}

type LedgerInput =
	| (TopUpInput & { transactionType: "TOPUP"; transactionId: string })
	| (BonusInput & { transactionType: "BONUS" })
	| (PurchaseInput & { transactionType: "PURCHASE"; referenceId: string });

async function applyWalletLedgerOperation(params: {
	input: LedgerInput;
	direction: "DEBIT" | "CREDIT";
	idempotencyKey: string;
}): Promise<TransactionResult> {
	const { input, direction, idempotencyKey } = params;
	const { userId, assetName: assetCode, amount } = input;
	const amountBigInt = BigInt(amount);

	const asset = await resolveAsset(assetCode);

	return executeWithRetry(async () => {
		return prisma.$transaction(async (tx: TxClient) => {
			await assertIdempotencyKeyAvailable(tx, idempotencyKey);

			const wallet = await getOrCreateWallet(tx, userId, asset.id);
			const lockedWallet = await lockWallet(tx, wallet.id);
			const currentBalance = BigInt(lockedWallet?.balance ?? 0n);

			const newBalance =
				direction === "CREDIT"
					? currentBalance + amountBigInt
					: currentBalance - amountBigInt;

			if (newBalance < 0n) {
				throw new InsufficientBalanceError(
					wallet.id,
					amountBigInt,
					currentBalance,
				);
			}
			let data: Prisma.JournalEntryUncheckedCreateInput;

			switch (input.transactionType) {
				case "TOPUP":
					data = {
						transactionType: "TOPUP",
						transactionId: input?.transactionId,
						walletId: wallet.id,
						assetId: asset.id,
						direction,
						amount: amountBigInt,
					};
					break;
				case "PURCHASE":
					data = {
						transactionType: "PURCHASE",
						referenceId: input.referenceId,
						walletId: wallet.id,
						assetId: asset.id,
						direction,
						amount: amountBigInt,
					};
					break;
				default:
					data = {
						transactionType: "BONUS",
						walletId: wallet.id,
						assetId: asset.id,
						direction,
						amount: amountBigInt,
					};
			}
			const entry = await tx.journalEntry.create({
				data,
			});

			await tx.wallet.update({
				where: { id: wallet.id },
				data: { balance: newBalance },
			});

			await tx.idempotencyKey.update({
				where: { key: idempotencyKey },
				data: { status: "PROCESSED", usedAt: new Date() },
			});

			return {
				ledgerEntryId: entry.id,
				type: input.transactionType,
				status: "PROCESSED" as const,
				amount: amountBigInt.toString(),
				assetName: assetCode,
				walletId: wallet.id,
				idempotencyKey,
				createdAt: entry.createdAt,
			};
		});
	});
}

export async function issueIdempotencyKey() {
	const key = await prisma.idempotencyKey.create({ data: {} });
	return {
		idempotencyKey: key.key,
		status: key.status,
		createdAt: key.createdAt,
	};
}

export async function topUp(
	input: TopUpInput,
	idempotencyKey: string,
): Promise<TransactionResult> {
	return applyWalletLedgerOperation({
		input: { ...input, transactionType: "TOPUP" },
		direction: "CREDIT",
		idempotencyKey,
	});
}

export async function issueBonus(
	input: BonusInput,
	idempotencyKey: string,
): Promise<TransactionResult> {
	return applyWalletLedgerOperation({
		input: { ...input, transactionType: "BONUS" },
		direction: "CREDIT",
		idempotencyKey,
	});
}

export async function purchase(
	input: PurchaseInput,
	idempotencyKey: string,
): Promise<TransactionResult> {
	return applyWalletLedgerOperation({
		input: { ...input, transactionType: "PURCHASE" },
		direction: "DEBIT",
		idempotencyKey,
	});
}

export async function getBalance(
	userId: string,
	assetCode?: Currency,
): Promise<WalletBalance[]> {
	await getUserById(userId);

	const where: Prisma.WalletWhereInput = { userId };
	if (assetCode) {
		const asset = await resolveAsset(assetCode);
		where.assetId = asset.id;
	}

	const wallets = await prisma.wallet.findMany({
		where,
		include: { asset: true },
	});

	return wallets.map((w) => ({
		walletId: w.id,
		userId: w.userId,
		assetName: w.asset.name,
		balance: w.balance.toString(),
	}));
}

export async function getTransactionHistory(params: {
	walletId: string;
	type?: TransactionType;
	limit: number;
	offset: number;
}) {
	const { walletId, type, limit, offset } = params;

	const where: Prisma.JournalEntryWhereInput = {
		walletId,
		transactionType: type,
	};

	const [entries, total] = await Promise.all([
		prisma.journalEntry.findMany({
			where,
			include: {
				wallet: true,
				asset: true,
			},
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
		}),
		prisma.journalEntry.count({ where }),
	]);

	return {
		transactions: entries.map((entry) => ({
			id: entry.id,
			type: entry.transactionType,
			status: "PROCESSED",
			walletId: entry.walletId,
			userId: entry.wallet.userId,
			assetName: entry.asset.name,
			transactionId: entry.transactionId,
			referenceId: entry.referenceId,
			direction: entry.direction,
			amount: entry.amount.toString(),
			createdAt: entry.createdAt,
		})),
		pagination: {
			total,
			limit,
			offset,
			hasMore: offset + limit < total,
		},
	};
}

export async function getTransaction(transactionId: string) {
	const entry = await prisma.journalEntry.findUnique({
		where: { id: transactionId },
		include: {
			wallet: true,
			asset: true,
		},
	});

	if (!entry) return null;

	return {
		id: entry.id,
		type: entry.transactionType,
		status: "PROCESSED" as const,
		walletId: entry.walletId,
		userId: entry.wallet.userId,
		assetCode: entry.asset.name,
		assetName: entry.asset.name,
		direction: entry.direction,
		amount: entry.amount.toString(),
		createdAt: entry.createdAt,
	};
}
