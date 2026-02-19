#!/bin/bash
set -e

echo "🦕 Starting Dino Ventures Wallet Service Setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker."
  exit 1
fi

echo "📦 Building and starting containers..."
docker compose up -d --build

echo "⏳ Waiting for database locally..."
# Simple wait loop for Postgres port
until nc -z localhost 5432; do
  echo "Waiting for postgres on port 5432..."
  sleep 2
done

echo "⏳ Waiting for API to be ready (migrations running)..."
# Loop until /health endpoint returns 200
until curl -s -f http://localhost:3000/health > /dev/null; do
  echo "Waiting for API to start..."
  sleep 3
done

echo "🌱 Seeding database..."
docker compose exec -T api pnpm run db:seed:prod

echo "✅ Setup complete! API is running at http://localhost:3000"
echo "Check README.md for API documentation."
