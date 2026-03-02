#!/bin/bash
set -e

echo "Starting Profile Service..."
echo "Waiting for database connection..."

# Extract host and port from DATABASE_URL dynamically
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*@[^:]+:([0-9]+)/.*|\1|')
DB_PORT=${DB_PORT:-5432}

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready! Running migrations..."
npx prisma migrate deploy

echo "Starting the application..."
if [ "$NODE_ENV" = "staging" ] || [ "$NODE_ENV" = "production" ]; then
  exec node dist/main
else
  exec npm run start:dev
fi
