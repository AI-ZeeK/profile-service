#!/bin/sh
set -e

echo "=========================================="
echo "Starting Profile Service..."
echo "=========================================="

# Function to check database connection
check_db() {
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$connect()
      .then(() => {
        console.log('✓ Database connection successful');
        process.exit(0);
      })
      .catch((e) => {
        console.error('✗ Database connection failed:', e.message);
        process.exit(1);
      });
  " 2>/dev/null
}

# Wait for database with timeout
echo "Waiting for database connection..."
echo "Database URL: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"

timeout=60
counter=0
until check_db || [ $counter -eq $timeout ]; do
  echo "  Waiting for database... ($counter/$timeout seconds)"
  sleep 2
  counter=$((counter + 2))
done

if [ $counter -eq $timeout ]; then
  echo "✗ Timeout waiting for database after $timeout seconds"
  echo "  Checking network connectivity..."
  echo "  - Testing DNS resolution:"
  getent hosts postgres || echo "    Cannot resolve 'postgres' hostname"
  echo "  - Testing port connectivity:"
  nc -zv postgres 5432 2>&1 || echo "    Cannot connect to postgres:5432"
  exit 1
fi

echo "✓ Database is ready! Running migrations..."

# Run database migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "✗ Migrations failed!"
  exit 1
fi

echo "✓ Migrations completed successfully"

echo "Running Prisma seed..."
npm run prisma:seed

if [ $? -ne 0 ]; then
  echo "✗ Seeding failed!"
  exit 1
fi

echo "✓ Seeding completed successfully"

# Verify the correct main.js exists
echo "Checking application files..."
MAIN_PATH="dist/src/main.js"

if [ ! -f "$MAIN_PATH" ]; then
  echo "✗ Error: $MAIN_PATH not found!"
  echo "  Contents of /app:"
  ls -la
  echo "  Contents of /app/dist:"
  ls -la dist/ || echo "  dist directory not found"
  echo "  Contents of /app/dist/src:"
  ls -la dist/src/ || echo "  dist/src directory not found"
  echo "  Looking for main.js:"
  find . -name "main.js" -type f 2>/dev/null || echo "  main.js not found anywhere"
  exit 1
fi

echo "✓ Application files verified (found at $MAIN_PATH)"

echo "=========================================="
echo "Starting application..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Environment: ${NODE_ENV:-staging}"
echo "Main path: $MAIN_PATH"
echo "=========================================="

# Start the application from the correct path
exec node $MAIN_PATH