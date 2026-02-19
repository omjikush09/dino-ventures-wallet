import { z } from "zod";
import { Currency, TransactionType } from "../generated/prisma/client";
import { paginationQuerySchema } from "./pagination.schema";

// ─── Shared Schemas ─────────────────────────────────────────────────────────────

const positiveAmountSchema = z
	.string()
	.regex(/^\d+$/, "Amount must be a positive integer string")
	.refine((val) => BigInt(val) > 0n, "Amount must be greater than 0");

const idempotencyKeySchema = z.uuid("Idempotency key must be a valid UUID");

// ─── Top-Up (Purchase Credits) ──────────────────────────────────────────────────

const ledgerSchema = z.object({
	userId: z.uuid(),
	assetName: z.enum(Currency),
	amount: positiveAmountSchema,
	transactionId: z.uuid(),
	referenceId: z.uuid(),
});

export const topUpSchema = ledgerSchema.omit({
	referenceId: true,
});

export type TopUpInput = z.infer<typeof topUpSchema>;

// ─── Bonus / Incentive ──────────────────────────────────────────────────────────

export const bonusSchema = ledgerSchema.omit({
	referenceId: true,
	transactionId: true,
});
export type BonusInput = z.infer<typeof bonusSchema>;

// ─── Purchase / Spend ───────────────────────────────────────────────────────────

export const purchaseSchema = ledgerSchema.omit({
	transactionId: true,
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;

// ─── Balance Query ──────────────────────────────────────────────────────────────

export const balanceParamsSchema = z.object({
	userId: z.uuid(),
});

export const balanceQuerySchema = z.object({
	assetName: z.enum(Currency).optional(),
});

export type BalanceParams = z.infer<typeof balanceParamsSchema>;
export type BalanceQuery = z.infer<typeof balanceQuerySchema>;

// ─── Transaction History Query ──────────────────────────────────────────────────

export const transactionHistorySchema = paginationQuerySchema.extend({
	walletId: z.uuid(),
	type: z.enum(TransactionType).optional(),
});

export type TransactionHistoryQuery = z.infer<typeof transactionHistorySchema>;

// ─── Transaction By ID ─────────────────────────────────────────────────────────

export const transactionIdParamsSchema = z.object({
	id: z.uuid(),
});

export type TransactionIdParams = z.infer<typeof transactionIdParamsSchema>;

// ─── Composite Request Schemas (for validate(schema)) ──────────────────────────

const emptyObjectSchema = z.object({});

export const topUpRequestSchema = z.object({
	body: topUpSchema,
	param: emptyObjectSchema.optional(),
	query: emptyObjectSchema.optional(),
	header: z.object({ "idempotency-key": idempotencyKeySchema }),
});
export type TopUpRequestSchema = z.infer<typeof topUpRequestSchema>;

export const bonusRequestSchema = z.object({
	body: bonusSchema,
	param: emptyObjectSchema.optional(),
	query: emptyObjectSchema.optional(),
	header: z.object({ "idempotency-key": idempotencyKeySchema }),
});
export type BonusRequestSchema = z.infer<typeof bonusRequestSchema>;

export const purchaseRequestSchema = z.object({
	body: purchaseSchema,
	param: emptyObjectSchema.optional(),
	query: emptyObjectSchema.optional(),
	header: z.object({ "idempotency-key": idempotencyKeySchema }),
});
export type PurchaseRequestSchema = z.infer<typeof purchaseRequestSchema>;

export const balanceSchema = z.object({
	body: emptyObjectSchema.optional(),
	param: balanceParamsSchema,
	query: balanceQuerySchema,
});
export type BalanceRequestSchema = z.infer<typeof balanceSchema>;

export const transactionHistoryRequestSchema = z.object({
	body: emptyObjectSchema.optional(),
	param: emptyObjectSchema.optional(),
	query: transactionHistorySchema,
});
export type TransactionHistoryRequestSchema = z.infer<
	typeof transactionHistoryRequestSchema
>;

export const transactionByIdSchema = z.object({
	body: emptyObjectSchema.optional(),
	param: transactionIdParamsSchema,
	query: emptyObjectSchema.optional(),
});
export type TransactionByIdRequestSchema = z.infer<
	typeof transactionByIdSchema
>;

// ─── Idempotency Key Generation ────────────────────────────────────────────────



export const issueIdempotencyKeyRequestSchema = z.object({
	body: emptyObjectSchema.optional(),
	param: emptyObjectSchema.optional(),
	query: emptyObjectSchema.optional(),
});
export type IssueIdempotencyKeyRequestSchema = z.infer<
	typeof issueIdempotencyKeyRequestSchema
>;
