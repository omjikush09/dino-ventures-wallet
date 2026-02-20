# Dino Ventures Wallet Service

Production-grade wallet service with double-entry ledger architecture, ACID compliance, and idempotency guarantees.

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Node.js 18+ (only for local non-docker development)
- pnpm

### Quick Deployment (recommended)

```bash
chmod +x setup.sh
./setup.sh
```

API: `http://localhost:3000`

Notes:
- Postgres image is `postgres:18`
- `setup.sh` builds/starts containers and waits until API health is ready

## Live Deployment

- URL: `https://dino-ventures-wallet-production.up.railway.app`
- Hosted as a serverless deployment, so the initial request after inactivity may take some time (cold start).

### Manual Docker Compose

```bash
docker compose up -d --build
```

## Local Development

1. Install deps:

```bash
pnpm install
```

2. Ensure env is available (for example via `.env`):

```env
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/dino_wallet?schema=public
NODE_ENV=development
PORT=3000
```

3. Start DB:

```bash
docker compose up -d db
```

4. Run migrations + seed:

```bash
pnpm run prisma:migrate
pnpm run db:seed
```

5. Start API:

```bash
pnpm run dev
```

Health endpoint: `GET /health`

## API Notes

- Header required for mutating wallet endpoints:
  - `idempotency-key: <uuid>`
- Currency field name is `assetName` (values: `GOLD`, `DIAMONDS`, `LOYALTY`)
- `amount` is a positive integer string

### Wallet Endpoints

- `POST /api/wallet/idempotency-key`
- `POST /api/wallet/topup`
- `POST /api/wallet/bonus`
- `POST /api/wallet/purchase`
- `GET /api/wallet/balance/:userId?assetName=GOLD`
- `GET /api/wallet/transactions?walletId=<uuid>&limit=20&offset=0`
- `GET /api/wallet/transactions/:id`

### Example Payloads

Top-up:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetName": "GOLD",
  "amount": "100",
  "transactionId": "9f1c2e34-7b8a-4c6d-9e0f-1a2b3c4d5e6f"
}
```

Bonus:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetName": "GOLD",
  "amount": "50"
}
```

Purchase:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetName": "GOLD",
  "amount": "25",
  "referenceId": "9f1c2e34-7b8a-4c6d-9e0f-1a2b3c4d5e6f"
}
```

## Postman

- Shared workspace collection:
  - https://www.postman.com/restless-space-930352/workspace/dino-ventures/collection/14294787-25078237-b8cd-4a1f-8977-8acb994f9787?action=share&creator=14294787
