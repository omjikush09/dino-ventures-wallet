# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json ./
COPY prisma ./prisma/

RUN pnpm install

COPY . .

# Generate Prisma Client to src/generated/prisma
RUN pnpm exec prisma generate

# Build TypeScript to dist
RUN pnpm run build

# Copy Prisma engine binaries to dist since tsc doesn't copy them
RUN cp src/generated/prisma/libquery_engine* dist/generated/prisma/ 2>/dev/null || :

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json ./
RUN pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma


EXPOSE 3000

CMD ["pnpm", "start"]
