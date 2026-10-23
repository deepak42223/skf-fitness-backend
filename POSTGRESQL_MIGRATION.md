# PostgreSQL Migration Guide

This guide explains how to migrate the SKF Fitness application from SQLite (development) to PostgreSQL (production).

## Prerequisites

- PostgreSQL 14+ database instance (local or hosted on Render/Railway/Supabase)
- Existing SQLite database with data to migrate
- Node.js and npm installed

## Step 1: Set Up PostgreSQL Database

### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (if not installed)
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# Create database
psql -U postgres
CREATE DATABASE skf_fitness;
CREATE USER skf_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE skf_fitness TO skf_user;
\q
```

### Option B: Render Managed PostgreSQL
1. Go to https://dashboard.render.com
2. Click "New" → "PostgreSQL"
3. Choose plan (Free tier available)
4. Note the connection details (Internal/External Database URL)

### Option C: Railway
1. Go to https://railway.app
2. Create new project → Add PostgreSQL
3. Copy connection URL from "Connect" tab

## Step 2: Configure Environment Variables

Update your `.env` file or environment configuration:

```env
# Database Configuration
DB_TYPE=postgres
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_USERNAME=skf_user
DB_PASSWORD=your_secure_password
DB_DATABASE=skf_fitness
DB_LOGGING=false

# For production on Render, use DATABASE_URL format:
# DATABASE_URL=postgresql://user:password@host:5432/database

# Keep SQLite config for local development fallback
# DB_TYPE=better-sqlite3
# DB_PATH=./skf-data.sqlite
```

## Step 3: Install PostgreSQL Driver

The `pg` package should already be installed. If not:

```bash
npm install pg
```

## Step 4: Generate TypeORM Migrations

Create an initial migration that captures the current schema:

```bash
# Ensure you're in the backend directory
cd skf-backend

# Generate migration from existing entities
npm run typeorm migration:generate -- -n InitialSchema src/migrations
```

This will create a file like `src/migrations/1234567890123-InitialSchema.ts` with all table definitions.

## Step 5: Run Migrations

```bash
# Apply migrations to PostgreSQL database
npm run typeorm migration:run
```

This creates all tables: members, profiles, payments, bookings, contact, reset_tokens, etc.

## Step 6: Export SQLite Data

If you have existing data in SQLite that needs to be migrated:

```bash
# Export SQLite data to JSON files
npm run db:export
```

This creates JSON files in `exports/` directory:
- `members.json`
- `profiles.json`
- `payments.json`
- `bookings.json`
- `contact.json`

## Step 7: Import Data to PostgreSQL

### Option A: Manual Import Script

Create `scripts/import-to-postgres.ts`:

```typescript
import { createConnection } from 'typeorm';
import * as fs from 'fs';
import { MemberEntity } from '../src/members/member.entity';
// ... import other entities

async function importData() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [MemberEntity, /* other entities */],
  });

  // Import members
  const members = JSON.parse(fs.readFileSync('./exports/members.json', 'utf8'));
  await connection.manager.save(MemberEntity, members);

  // Import other data...
  
  await connection.close();
  console.log('Data import complete!');
}

importData().catch(console.error);
```

Run with: `npm run ts-node scripts/import-to-postgres.ts`

### Option B: Use pg_dump (for complex migrations)

If you have a lot of data, consider using database migration tools like `pgloader`.

## Step 8: Verify Database Connection

Test that your application connects to PostgreSQL:

```bash
# Start the application
npm run start:dev

# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "ok",
#   "database": "connected",
#   "uptime": 5,
#   "timestamp": "2024-01-15T10:30:00.000Z",
#   "environment": "development"
# }
```

## Step 9: Update Production Configuration

For deployment on Render:

1. **Set Environment Variables** in Render Dashboard:
   - `DB_TYPE=postgres`
   - `DATABASE_URL` (auto-populated if using Render PostgreSQL)
   - Other env vars from `.env.example`

2. **Update database.module.ts** (already configured):
   - Uses `DB_TYPE` to switch between SQLite and PostgreSQL
   - PostgreSQL config includes SSL for production

3. **Deploy**:
   ```bash
   git add .
   git commit -m "feat: add PostgreSQL support with migrations"
   git push origin main
   ```

## Important Notes

### ⚠️ Production Safety

1. **NEVER set `synchronize: true` in production PostgreSQL**
   - Current config has `synchronize: false` for PostgreSQL
   - Always use migrations to update schema

2. **Backup before migration**:
   ```bash
   # Backup SQLite
   cp skf-data.sqlite skf-data.backup.sqlite
   
   # Backup PostgreSQL (after migration)
   pg_dump -U skf_user skf_fitness > backup.sql
   ```

3. **Test migration in staging first**:
   - Create a staging database
   - Run migration on staging
   - Verify all data and functionality
   - Then migrate production

### Schema Differences: SQLite vs PostgreSQL

| Feature | SQLite | PostgreSQL |
|---------|---------|------------|
| Boolean | 0/1 (integer) | true/false |
| Auto-increment | `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL` or `BIGSERIAL` |
| JSON | TEXT | `json` or `jsonb` |
| Timestamps | TEXT (ISO 8601) | `timestamp` or `timestamptz` |

TypeORM handles most of these automatically, but verify data types after migration.

## Troubleshooting

### Connection Errors

```
Error: connect ECONNREFUSED
```
**Solution**: Check DB_HOST, DB_PORT, firewall rules, and database is running.

```
Error: password authentication failed
```
**Solution**: Verify DB_USERNAME and DB_PASSWORD are correct.

### Migration Errors

```
Error: relation "members" already exists
```
**Solution**: Database already has tables. Either:
1. Drop all tables: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
2. Or skip initial migration if tables match current schema

### SSL Errors

```
Error: self signed certificate
```
**Solution**: Set `ssl: { rejectUnauthorized: false }` in production config (already configured).

## Rollback Plan

If migration fails:

1. **Switch back to SQLite**:
   ```env
   DB_TYPE=better-sqlite3
   DB_PATH=./skf-data.sqlite
   ```

2. **Restore SQLite backup**:
   ```bash
   cp skf-data.backup.sqlite skf-data.sqlite
   ```

3. **Revert migrations** (PostgreSQL):
   ```bash
   npm run typeorm migration:revert
   ```

## Performance Optimization (Post-Migration)

After migrating to PostgreSQL:

1. **Add indexes** for frequently queried fields:
   ```sql
   CREATE INDEX idx_members_email ON members(email);
   CREATE INDEX idx_payments_member ON payments(memberId);
   CREATE INDEX idx_bookings_member ON bookings(memberId);
   ```

2. **Enable connection pooling** (already in TypeORM config)

3. **Set up automated backups** on Render/Railway

4. **Monitor query performance** with `DB_LOGGING=true` initially

## Resources

- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Render PostgreSQL](https://render.com/docs/databases)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)

## Support

For issues during migration:
1. Check logs: `npm run start:dev` and review console output
2. Test database connection: Use pgAdmin or `psql` CLI
3. Verify environment variables are loaded correctly
