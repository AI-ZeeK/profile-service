# Profile Service Setup Guide

This guide explains how the Profile Service handles database setup, migrations, and seeding.

## Docker Setup (Recommended)

### How it Works

When the Profile Service container starts, the `docker-entrypoint.sh` script runs automatically and performs the following steps:

1. **Wait for Database** - Waits until PostgreSQL is ready
2. **Run Migrations** - Applies all Prisma migrations to create tables
3. **Seed Database** - Populates initial data (roles, etc.)
4. **Start Service** - Launches the NestJS application with hot reload

### Start the Service

```bash
# From the backend directory
./start-profile-dev.bat

# Or using docker-compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up profile-service
```

### View Logs

To see the migration and seeding process:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f profile-service
```

You should see output like:

```
Starting Profile Service...
Waiting for database connection...
Database is ready! Running migrations...
Running seed script...
role:- BUSINESS_USER seeded successfully
role:- PLATFORM seeded successfully
role:- CLIENT seeded successfully
role:- STAFF seeded successfully
role:- AGENCY seeded successfully
Starting the application...
```

## Local Development Setup

### Prerequisites

1. PostgreSQL running (via Docker or locally)
2. Node.js 18+
3. npm packages installed

### Setup Steps

```bash
# 1. Navigate to profile-service directory
cd backend/profile-service

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Make sure local.env exists with DATABASE_URL

# 4. Run migrations
npx prisma migrate dev

# 5. Seed the database
npm run prisma:seed

# 6. Start the service
npm run start:dev
```

### Quick Setup Script

Use the provided PowerShell script for automated setup:

```bash
# From backend directory
powershell -ExecutionPolicy Bypass -File setup-profile-service.ps1
```

## Database Access

### Using pgAdmin

1. Open: http://localhost:5051
2. Login: admin@djengo.com / admin
3. Add Server:
   - Name: DJENGO PostgreSQL
   - Host: postgres
   - Port: 5432
   - Database: djengo_profiles
   - Username: postgres
   - Password: postgres

### Database Structure

- **Database**: `djengo_profiles`
- **Schemas**:
  - `profiles` - User data
  - `roles` - Role and permission data
  - `platform` - Platform-specific data

### Seeded Data

The seed script creates these default roles in `roles.roles`:

| Role Name     | Description                                          |
| ------------- | ---------------------------------------------------- |
| BUSINESS_USER | Works under a company/agency, manages operations     |
| PLATFORM      | Manages platform-level features and settings         |
| CLIENT        | Books and uses services (houses, hotels, etc.)       |
| STAFF         | Works under company/agency for day-to-day operations |
| AGENCY        | Manages rental properties (Airbnbs, houses)          |

## Troubleshooting

### Migrations Not Running

If tables aren't being created:

```bash
# Force reset and recreate everything
cd profile-service
npx prisma migrate reset --force
npm run prisma:seed
```

### Seed Script Fails

```bash
# Run seed manually to see errors
cd profile-service
npm run prisma:seed
```

### Container Won't Start

Check the logs:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs profile-service
```

Common issues:

- Database not ready (wait a few seconds)
- Migration conflicts (reset database)
- Missing environment variables

### Rebuild Container

If you've made changes to the Dockerfile:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache profile-service
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up profile-service
```

## Scripts Reference

### NPM Scripts

- `npm run start:dev` - Start with hot reload
- `npm run prisma:seed` - Run seed script
- `npx prisma migrate dev` - Create and apply migration
- `npx prisma migrate deploy` - Apply migrations (production)
- `npx prisma db push` - Push schema without migration
- `npx prisma studio` - Open Prisma Studio GUI

### PowerShell Scripts

- `seed-database.ps1` - Seed the database
- `setup-profile-service.ps1` - Complete setup (DB + migrations + seed + start)

## Environment Variables

Required variables in `local.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/djengo_profiles?schema=public
NODE_ENV=development
GRPC_HOST=0.0.0.0
PROFILE_SERVICE_PORT=50051
```

## Production Deployment

For production, the process is similar but uses:

- `Dockerfile.prod` instead of `Dockerfile.dev`
- `npx prisma migrate deploy` instead of `migrate dev`
- Production environment variables
- No hot reload

---

**Need Help?** Check the logs first, they usually show what's wrong!


