#!/bin/bash
set -e

echo "Starting Profile Service..."

# Show the database URL (safe for dev, don't do this in production logs)
echo "Using DATABASE_URL: $DATABASE_URL"
echo "Waiting for database connection..."

until pg_isready -h postgres -p 5432 -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready! Running migrations..."
# npx prisma migrate reset --force
npx prisma db push

echo "Running seed script..."
npm run prisma:seed

echo "Starting the application..."
exec npm run start:dev
