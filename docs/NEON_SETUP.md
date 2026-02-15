# Neon Database Setup Guide

This guide walks through setting up Neon as your PostgreSQL database provider. **This is the recommended approach for production deployments.**

## ⚠️ Critical: Why NOT Render's Database?

**Render's free PostgreSQL database has a critical limitation:**
- **All data is permanently deleted after 90 days**
- This means you will lose:
  - All your newsletters
  - All your subscribers
  - All your analytics data
- There is no warning before deletion
- There is no way to recover the data

**For this reason, we STRONGLY recommend using Neon instead of Render's database, even for hobby projects.**

## ✅ Why Neon?

**Advantages over Render's free database:**
- **✨ No expiration** - Your data is safe forever (not just 90 days)
- **10GB storage** - 10x more than Render's 1GB limit
- **10 free projects** - Room to grow (vs Supabase's 2 projects)
- **Built-in connection pooling** - Better performance
- **Auto-scaling and auto-suspend** - Saves resources when idle
- **No credit card required** - Truly free to start

**Free tier limitations (minor):**
- Database auto-suspends after 5 minutes of inactivity
- First query after suspension takes 1-2 seconds to wake up (cold start)
- 3GB compute RAM

**Bottom line:** Neon is free, has no data expiration, and is perfect for newsletters that you want to keep running indefinitely.

## Prerequisites

- Neon account (sign up at https://neon.tech - free, no credit card required)
- Your schema files in `server/src/`
- `psql` command-line tool installed (comes with PostgreSQL)

## Step 1: Create Neon Project

1. **Sign up or log in** to Neon
   - Go to https://neon.tech
   - Click "Sign Up" (GitHub/Google/Email)

2. **Create new project**
   - Click "New Project" in the dashboard
   - **Name:** `newsletter-builder` (or your preferred name)
   - **Region:** Choose closest to your location
     - US East (Ohio) - `us-east-2`
     - US West (Oregon) - `us-west-2`
     - Europe (Frankfurt) - `eu-central-1`
   - **Postgres version:** 16 (or latest)
   - Click "Create Project"

3. **Copy connection string**
   - After creation, you'll see the connection string
   - Format: `postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
   - Click the copy icon or manually copy the entire string
   - Save this securely - you'll need it for the next steps

## Step 2: Apply Database Schema

From your local machine, apply your schema and migrations:

```bash
# Navigate to your project directory
cd /path/to/newsletter-builder

# Apply the main schema
psql "postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" -f server/src/schema.sql

# Apply migrations
psql "postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" -f server/src/migrations/add_project_name.sql

psql "postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" -f server/src/migrations/add_analytics.sql
```

**Note:** Replace the connection string with your actual Neon connection string.

**Expected output:**
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
...
```

## Step 3: Update Local Development

Update your local `.env` file to use Neon:

```bash
# Edit server/.env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

**Test locally:**
```bash
cd server
npm run dev
```

Open http://localhost:5050/api/health - should return `{"ok":true}`

## Step 4: Update Render Backend (If Deployed)

### Option A: First Time Deployment

When following `DEPLOYMENT.md`, skip Step 1 (Create PostgreSQL Database) and use your Neon connection string in Step 2:

```bash
# In Render backend environment variables
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### Option B: Already Deployed with Render Database

If you already have a Render database with data:

1. **Export existing data from Render:**
   ```bash
   # Get external database URL from Render dashboard
   pg_dump "postgresql://render-user:password@xxx.render.com/dbname" > backup.sql
   ```

2. **Import to Neon:**
   ```bash
   psql "postgresql://neon-user:password@ep-xxx.neon.tech/neondb?sslmode=require" < backup.sql
   ```

3. **Update Render environment variables:**
   - Go to https://dashboard.render.com
   - Click your backend service (`newsletter-builder-api`)
   - Click "Environment" in left sidebar
   - Find `DATABASE_URL` and click "Edit"
   - Replace with your Neon connection string
   - Click "Save Changes"
   - Render will automatically redeploy

4. **Delete old Render database (optional):**
   - Go to Render dashboard
   - Click on your PostgreSQL database
   - Click "Settings" → "Delete Database"
   - This frees up your free tier slot

## Step 5: Verify Everything Works

**Backend health check:**
```bash
curl https://your-backend.onrender.com/api/health
# Should return: {"ok":true}
```

**Test database connection:**
```bash
# List all newsletters (should return empty array initially)
curl https://your-backend.onrender.com/api/newsletters
```

**Check Render logs:**
- Go to backend service dashboard
- Click "Logs" tab
- Look for "Connected to database" or similar success message
- No database connection errors

## Neon Dashboard Features

Access your Neon dashboard at https://console.neon.tech

**Useful features:**
- **SQL Editor** - Run queries directly in the browser
- **Monitoring** - View database metrics and query performance
- **Branches** - Create database branches for testing (similar to git branches)
- **Connection pooling** - Already enabled by default
- **Backups** - Automatic point-in-time restore

## Manual Backups (Optional but Recommended)

Even though Neon won't delete your data, backups are good practice:

```bash
# Create backup
pg_dump "postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require" > backup-$(date +%Y%m%d).sql

# Compress backup
pg_dump "postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require" | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore from backup
psql "postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require" < backup-20260209.sql
```

**Schedule weekly backups:**
- Add to cron job (Linux/Mac)
- Use GitHub Actions
- Store in Dropbox/Google Drive

## Cost Comparison

| Provider | Free Tier | Limitations | Paid Upgrade |
|----------|-----------|-------------|--------------|
| **Neon** | 10GB storage, 10 projects | Auto-suspend after 5 min | $19/mo for always-on |
| **Render** | 1GB storage, 90-day limit | Expires after 3 months | $7/mo for persistent |
| **Supabase** | 500MB storage, 2 projects | 2 project limit | $25/mo for more projects |

## Troubleshooting

### Connection errors

**Error:** `connection refused` or `timeout`
- Check connection string is correct
- Ensure `?sslmode=require` is at the end
- Verify database isn't paused in Neon dashboard

**Error:** `password authentication failed`
- Regenerate password in Neon dashboard
- Get new connection string with updated password

### Schema not applying

**Error:** `relation already exists`
- Tables already exist (this is OK)
- Skip to migrations if schema was already applied

**Error:** `permission denied`
- Check you're using the connection string from Neon dashboard
- Verify user has correct permissions

### Slow first query

**Normal behavior:**
- First query after 5 minutes takes 1-2 seconds (cold start)
- Subsequent queries are fast
- This is expected on free tier

**Solution for production:**
- Keep database active with periodic health checks
- Upgrade to Neon Pro ($19/mo) for always-on compute

### Render can't connect to Neon

**Check:**
- Connection string format is correct
- SSL mode is enabled (`?sslmode=require`)
- No trailing spaces in environment variable
- Render service redeployed after changing `DATABASE_URL`

## Migration from Other Providers

### From Render Database

```bash
# 1. Export from Render
pg_dump "<RENDER_EXTERNAL_URL>" > render_backup.sql

# 2. Import to Neon
psql "<NEON_CONNECTION_STRING>" < render_backup.sql

# 3. Update Render backend DATABASE_URL to Neon
# 4. Delete Render database (optional)
```

### From Supabase

```bash
# 1. Get Supabase connection string from project settings
# 2. Export from Supabase
pg_dump "<SUPABASE_CONNECTION_STRING>" > supabase_backup.sql

# 3. Import to Neon
psql "<NEON_CONNECTION_STRING>" < supabase_backup.sql

# 4. Update your backend to use Neon connection string
```

## Security Best Practices

- **Never commit connection strings** to git
- Store in `.env` files (already in `.gitignore`)
- Use environment variables in production
- Rotate passwords periodically in Neon dashboard
- Limit connections to your backend only (configure IP allowlist in Neon if needed)

## Next Steps

After Neon is set up:

1. Complete Render deployment (see `DEPLOYMENT.md`)
2. Set up subscriber forms (see `SUBSCRIPTION_SETUP.md`)
3. Configure email sending with Resend
4. Test the full newsletter flow
5. Set up manual or automated backups

## Support

- **Neon Docs:** https://neon.tech/docs/introduction
- **Neon Discord:** https://discord.gg/neon
- **Neon Status:** https://neonstatus.com

## Summary

**What you get with this setup:**
- Free PostgreSQL database with no expiration
- 10GB storage for your newsletters and subscribers
- Auto-scaling and auto-suspend to save resources
- Built-in connection pooling
- Point-in-time restore for disaster recovery
- Room for 9 more free projects

**Total cost:** $0/month (on free tier)

Ready to deploy? Follow this guide step-by-step, then continue with the Render deployment in `DEPLOYMENT.md`.
