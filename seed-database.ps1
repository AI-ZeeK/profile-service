# PowerShell script to seed the profile service database
Write-Host "🌱 Seeding Profile Service Database..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the profile-service directory" -ForegroundColor Red
    exit 1
}

# Check if database is running
Write-Host "🔍 Checking database connection..." -ForegroundColor Yellow
try {
    docker exec backend-postgres-1 psql -U postgres -d djengo_profiles -c "SELECT 1;" > $null 2>&1
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Cannot connect to database. Make sure PostgreSQL is running." -ForegroundColor Red
    Write-Host "   Run: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres" -ForegroundColor Yellow
    exit 1
}

# Run the seed script
Write-Host "🌱 Running seed script..." -ForegroundColor Yellow
try {
    npm run prisma:seed
    Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Failed to seed database" -ForegroundColor Red
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

Write-Host "🎉 Seeding completed successfully!" -ForegroundColor Green
Write-Host "📊 You can now view the seeded data in pgAdmin at http://localhost:5051" -ForegroundColor Cyan


