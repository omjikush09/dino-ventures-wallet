# 🦕 Dino Ventures Wallet Service

Production-grade wallet service with double-entry ledger architecture, ACID compliance, and idempotency guarantees.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js v18+ (optional, for local dev)

### Automated Setup (Recommended)

Run the setup script to build containers, migrate database, and seed initial data:

```bash
chmod +x setup.sh
./setup.sh
```

The API will be available at `http://localhost:3000`.

---

## 🏗 Architecture & Design Decisions

### 1. Double-Entry Ledger

Instead of a simple `balance` column, every transaction is recorded as two immutable **Journal Entries** (Credit & Debit). This ensures:

- **Auditability**: Complete history of fund movement.
- **Consistency**: Sum of all debits = sum of all credits.
- **System Integrity**: Validates money is not created or destroyed.

### 2. Concurrency Control (Deadlock Avoidance)

High-concurrency scenarios (e.g., thousands of users topping up simultaneously) can cause race conditions.

- **Problem**: Deadlocks occur when two transactions lock resources in different orders.
- **Solution**: **Consistent Lock Ordering**.
  - All transactions lock participating wallets in **lexicographical order** (ID sort).
  - Uses `SELECT ... FOR UPDATE` to acquire row-level locks.
  - Implements **Serializable** isolation level for strict consistency.
  - Automatic **retry mechanism** with exponential backoff for serialization failures.

### 3. Idempotency

Prevents duplicate processing of the same transaction (e.g., network retries).

- Clients must provide a unique `idempotencyKey` for every mutation.
- The system checks if the key exists before processing.
- If found, returns the original successful response without re-executing logic.

### 4. Tech Stack

- **Language**: TypeScript (Node.js)
- **Database**: PostgreSQL 15
- **ORM**: Prisma v7 (with `@prisma/adapter-pg` driver adapter for direct connection)
- **Validation**: Zod v4
- **Logging**: Winston (JSON format in production)

---

## 📚 API Endpoints

### 1. Top-Up Wallet

Credit user funds from external source.

`POST /api/wallet/topup`

```json
{
	"userId": "uuid-user-id",
	"assetCode": "GOLD",
	"amount": "100",
	"idempotencyKey": "unique-req-id"
}
```

### 2. Issue Bonus

System issues free credits.

`POST /api/wallet/bonus`

```json
{
	"userId": "uuid-user-id",
	"assetCode": "GOLD",
	"amount": "50",
	"idempotencyKey": "unique-req-id-2"
}
```

### 3. Purchase Item

Spend user credits.

`POST /api/wallet/purchase`

```json
{
	"userId": "uuid-user-id",
	"assetCode": "GOLD",
	"amount": "25",
	"idempotencyKey": "unique-req-id-3"
}
```

### 4. Check Balance

`GET /api/wallet/balance/:userId?assetCode=GOLD`

### 5. Transaction History

`GET /api/wallet/transactions?userId=uuid-user-id&limit=20&offset=0`

---

## 🛠 Local Development

```bash
# Install dependencies
pnpm install

# Start database
docker compose up -d db

# Run migrations
pnpm exec prisma migrate dev

# Seed data
pnpm run db:seed

# Start dev server
pnpm run dev
```

## 🧪 Testing

To reset the database and re-seed:

```bash
pnpm exec prisma migrate reset
pnpm run db:seed
```
