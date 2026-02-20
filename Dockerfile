# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma Client to src/generated/prisma
RUN pnpm exec prisma generate

# Build TypeScript to dist
RUN pnpm run build


# Production stage
FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# Keep Prisma CLI and prisma config dependencies available at runtime.
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Need for migration
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

CMD ["pnpm", "start"]
