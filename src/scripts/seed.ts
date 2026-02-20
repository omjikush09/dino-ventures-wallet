import { AccountType, Currency } from "../generated/prisma/client";
import logger from "../lib/logger";
import { SYSTEM_ACCOUNTS } from "../lib/constants";
import prisma from "../lib/prisma";

async function seed() {
	logger.info("🌱 Starting database seeding...");

	// ─── 1. Asset Types ─────────────────────────────────────────────────────────
	logger.info("Creating asset types...");

	const goldCoins = await prisma.assetType.upsert({
		where: { name: Currency.GOLD },
		update: {},
		create: {
			name: Currency.GOLD,
		},
	});

	const diamonds = await prisma.assetType.upsert({
		where: { name: Currency.DIAMONDS },
		update: {},
		create: {
			name: Currency.DIAMONDS,
		},
	});

	const loyaltyPoints = await prisma.assetType.upsert({
		where: { name: Currency.LOYALTY },
		update: {},
		create: {
			name: Currency.LOYALTY,
		},
	});

	logger.info("✅ Asset types created", {
		assets: [goldCoins.name, diamonds.name, loyaltyPoints.name],
	});

	// ─── 2. System Accounts ───────────────────────────────────────────────────────
	logger.info("Creating system accounts...");

	const treasury = await prisma.user.upsert({
		where: { email: SYSTEM_ACCOUNTS.TREASURY },
		update: {},
		create: {
			email: SYSTEM_ACCOUNTS.TREASURY,
			name: "Treasury",
			type: AccountType.SYSTEM,
		},
	});

	const revenue = await prisma.user.upsert({
		where: { email: SYSTEM_ACCOUNTS.REVENUE },
		update: {},
		create: {
			email: SYSTEM_ACCOUNTS.REVENUE,
			name: "Revenue",
			type: AccountType.SYSTEM,
		},
	});

	logger.info("✅ System accounts created", {
		treasury: treasury.id,
		revenue: revenue.id,
	});

	// Create treasury wallets for all asset types (with large initial supply)
	for (const asset of [goldCoins, diamonds, loyaltyPoints]) {
		await prisma.wallet.upsert({
			where: {
				userId_assetId: { userId: treasury.id, assetId: asset.id },
			},
			update: {},
			create: {
				userId: treasury.id,
				assetId: asset.id,
				balance: 1_000_000_000n, // 1 billion units
			},
		});

		await prisma.wallet.upsert({
			where: {
				userId_assetId: { userId: revenue.id, assetId: asset.id },
			},
			update: {},
			create: {
				userId: revenue.id,
				assetId: asset.id,
				balance: 0n,
			},
		});
	}

	logger.info("✅ System wallets created");

	// ─── 3. User Accounts ────────────────────────────────────────────────────────
	logger.info("Creating user accounts...");

	const alice = await prisma.user.upsert({
		where: { email: "alice@example.com" },
		update: {},
		create: {
			email: "alice@example.com",
			name: "Alice Johnson",
			type: AccountType.USER,
		},
	});

	const bob = await prisma.user.upsert({
		where: { email: "bob@example.com" },
		update: {},
		create: {
			email: "bob@example.com",
			name: "Bob Smith",
			type: AccountType.USER,
		},
	});

	logger.info("✅ Users created", { alice: alice.id, bob: bob.id });

	// Give users initial balances via proper ledger entries
	// Alice: 1000 Gold Coins, 50 Diamonds, 500 Loyalty Points
	// Bob:   500 Gold Coins, 25 Diamonds, 200 Loyalty Points

	const initialBalances = [
		{ user: alice, asset: goldCoins, amount: 1000n },
		{ user: alice, asset: diamonds, amount: 50n },
		{ user: alice, asset: loyaltyPoints, amount: 500n },
		{ user: bob, asset: goldCoins, amount: 500n },
		{ user: bob, asset: diamonds, amount: 25n },
		{ user: bob, asset: loyaltyPoints, amount: 200n },
	];

	for (const { user, asset, amount } of initialBalances) {
		// Create user wallet
		const wallet = await prisma.wallet.upsert({
			where: {
				userId_assetId: { userId: user.id, assetId: asset.id },
			},
			update: { balance: amount },
			create: {
				userId: user.id,
				assetId: asset.id,
				balance: amount,
			},
		});


		logger.info(`  ${user.name}: ${amount} ${asset.name}`);
	}

	logger.info("✅ Initial balances seeded via ledger entries");

	// ─── Summary ──────────────────────────────────────────────────────────────────
	const totalUsers = await prisma.user.count();
	const totalWallets = await prisma.wallet.count();
	const totalAssets = await prisma.assetType.count();
	const totalEntries = await prisma.journalEntry.count();

	logger.info("🎉 Seeding complete!", {
		users: totalUsers,
		wallets: totalWallets,
		assetTypes: totalAssets,
		journalEntries: totalEntries,
	});
}

seed()
	.catch((error) => {
		logger.error("Seeding failed", {
			error: error.message,
			stack: error.stack,
		});
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
