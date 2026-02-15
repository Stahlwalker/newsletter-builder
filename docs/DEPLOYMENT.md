# Deployment Guide - Render

This guide walks through deploying the Newsletter Builder to Render.

## ⚠️ CRITICAL: Database Warning

**DO NOT use Render's PostgreSQL database for production!**

Render's free database **permanently deletes all your data after 90 days**:
- All newsletters will be lost
- All subscribers will be lost
- All analytics will be lost
- No recovery is possible

**Instead, use Neon (free forever):**
- See [NEON_SETUP.md](NEON_SETUP.md) for setup
- Neon is free, has no expiration, and works perfectly with Render
- This guide assumes you're using Neon

## Overview

You'll deploy to Render:
1. **Database: Use Neon** (external, free forever) - See NEON_SETUP.md
2. **Web Service (Backend)** - Express API server on Render
3. **Static Site (Frontend)** - React app on Render (free static hosting)

**Estimated time:** 20-30 minutes

**Cost:**
- Neon database: **FREE** (forever, no expiration)
- Render backend: **$7/month** (or free tier with cold starts)
- Render frontend: **FREE** (static site hosting)
- **Total: ~$7/month** (vs ~$14/month with Render database)

## Prerequisites

- **Neon database** - Set up first using [NEON_SETUP.md](NEON_SETUP.md)
- GitHub/GitLab account (to connect your repo)
- Render account (sign up at https://render.com)
- Resend API key (from https://resend.com)
- OpenAI API key (from https://platform.openai.com)
- Your code pushed to a Git repository

## Step 1: Set Up Database (Use Neon)

**Follow the [NEON_SETUP.md](NEON_SETUP.md) guide to:**
1. Create a free Neon account
2. Create a new project
3. Copy your connection string
4. Apply the schema and migrations

Once complete, you'll have a `DATABASE_URL` that looks like:
```
postgresql://user:pass@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Save this connection string** - you'll need it in Step 2.

> 💡 **Why skip Render's database?** It deletes all data after 90 days. Neon is free forever and saves you $7/month.

## Step 2: Deploy Backend (Web Service)

1. **Create New Web Service**
   - From Render dashboard, click "New +" → "Web Service"
   - Connect your Git repository
   - Select the `newsletter-builder` repository

2. **Configure Service**
   - **Name:** `newsletter-builder-api`
   - **Region:** Choose closest to you (or match your Neon region for lower latency)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (for testing) or Starter ($7/mo)

3. **Add Environment Variables**

   Click "Advanced" → "Add Environment Variable" for each:

   ```bash
   # Database (use your Neon connection string from Step 1)
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

   # Resend Email
   RESEND_API_KEY=<YOUR_RESEND_API_KEY>
   RESEND_FROM="Newsletter <hello@yourdomain.com>"

   # OpenAI
   OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

   # Server Config
   PORT=10000
   NODE_ENV=production

   # Public URLs (update after backend deploys)
   PUBLIC_BASE_URL=https://newsletter-builder-api.onrender.com
   CONFIRM_REDIRECT_URL=https://yourdomain.com/newsletter/confirmed
   ```

   **Note:** Replace `newsletter-builder-api` with your actual Render service name.
   **Important:** Use your **Neon connection string** for DATABASE_URL (not Render's database).

4. **Create Web Service**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Wait 3-5 minutes for first deploy
   - Copy your service URL (e.g., `https://newsletter-builder-api.onrender.com`)

5. **Test Backend**
   ```bash
   curl https://newsletter-builder-api.onrender.com/api/health
   # Should return: {"ok":true}
   ```

## Step 3: Deploy Frontend (Static Site)

1. **Create New Static Site**
   - From Render dashboard, click "New +" → "Static Site"
   - Connect the same Git repository
   - Select the `newsletter-builder` repository

2. **Configure Static Site**
   - **Name:** `newsletter-builder-ui`
   - **Branch:** `main`
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

3. **Add Environment Variables**

   Click "Advanced" → "Add Environment Variable":

   ```bash
   # Point to your backend API (use URL from Step 2)
   VITE_API_BASE=https://newsletter-builder-api.onrender.com/api
   ```

4. **Create Static Site**
   - Click "Create Static Site"
   - Render will build and deploy automatically
   - Wait 2-3 minutes for build
   - Copy your frontend URL (e.g., `https://newsletter-builder-ui.onrender.com`)

5. **Test Frontend**
   - Open your frontend URL in a browser
   - You should see the Newsletter Builder interface
   - Try creating a newsletter to verify API connection

## Step 4: Update Environment Variables

Now that both services are deployed, update the backend's `PUBLIC_BASE_URL`:

1. Go to backend service dashboard
2. Click "Environment" in left sidebar
3. Update `PUBLIC_BASE_URL` to your backend URL:
   ```bash
   PUBLIC_BASE_URL=https://newsletter-builder-api.onrender.com
   ```
4. Click "Save Changes"
5. Render will automatically redeploy

## Step 5: Configure CORS (Security)

For production, restrict CORS to only your domains.

**Edit `server/src/index.js`:**

```javascript
app.use(cors({
  origin: [
    'https://newsletter-builder-ui.onrender.com',
    'https://yourdomain.com'
  ],
  credentials: true
}));
```

Commit and push to trigger a redeploy.

## Step 6: Verify Deployment

**Backend checks:**
- [ ] Health endpoint works: `https://your-api.onrender.com/api/health`
- [ ] Database connection successful (no errors in logs)
- [ ] API endpoints respond (check Render logs)

**Frontend checks:**
- [ ] UI loads without errors
- [ ] Can create a new newsletter
- [ ] AI snippet generation works
- [ ] Email preview opens

**Email checks:**
- [ ] Test subscription via `/api/subscribe` endpoint
- [ ] Verification email arrives
- [ ] Confirmation link redirects properly

## Step 7: Set Up Custom Domain (Optional)

### Backend API

1. In backend service dashboard, click "Settings"
2. Scroll to "Custom Domain"
3. Add: `api.yourdomain.com` (or your preferred subdomain)
4. Follow DNS instructions (add CNAME record)
5. Update `PUBLIC_BASE_URL` environment variable
6. Update `VITE_API_BASE` in frontend environment variables

### Frontend UI

1. In frontend static site dashboard, click "Settings"
2. Scroll to "Custom Domain"
3. Add: `newsletter.yourdomain.com` (or your preferred subdomain)
4. Follow DNS instructions (add CNAME record)
5. Update CORS in backend to include your custom domain

## Monitoring & Maintenance

### View Logs

**Backend logs:**
- Go to backend service dashboard
- Click "Logs" tab
- Monitor for errors, API requests, scheduled sends

**Frontend logs:**
- Go to static site dashboard
- Click "Logs" tab
- Check build logs for issues

### Database Backups

Your database is on Neon, which provides automatic point-in-time restore.

**Manual backup (recommended):**
```bash
# Download backup from Neon
pg_dump "<YOUR_NEON_CONNECTION_STRING>" > backup.sql

# Restore backup
psql "<YOUR_NEON_CONNECTION_STRING>" < backup.sql
```

See [NEON_SETUP.md](NEON_SETUP.md) for more backup details.

### Free Tier Limitations

If using free tier, note:
- **Backend (Render):** Spins down after 15 minutes of inactivity (cold start = 30-60 seconds)
- **Database (Neon):** Auto-suspends after 5 minutes of inactivity (1-2 second cold start), but **no data expiration**
- **Frontend (Render):** No spin-down, unlimited bandwidth

For production, upgrade Render backend to $7/month to eliminate cold starts. Database stays free on Neon forever.

## Troubleshooting

### Backend won't start

**Check Render logs for errors:**
- Database connection issues? Verify `DATABASE_URL`
- Module not found? Check `npm install` ran successfully
- Port issues? Render sets `PORT` automatically, ensure code uses `process.env.PORT`

### Frontend shows "API is offline"

**Verify:**
- Backend is deployed and healthy
- `VITE_API_BASE` points to correct backend URL (with `/api` at end)
- CORS allows your frontend domain
- No errors in browser console (F12)

### Verification emails not sending

**Check:**
- `RESEND_API_KEY` is set correctly
- `RESEND_FROM` email is verified in Resend dashboard
- Check Resend dashboard for delivery logs
- Verify `PUBLIC_BASE_URL` is correct (used in verification links)

### Database migration fails

**Solution:**
- Use external connection URL (not internal)
- Check SQL syntax for PostgreSQL compatibility
- Run migrations manually via Render shell or psql

### Build fails

**Frontend build fails:**
- Check Node.js version compatibility
- Verify all dependencies in `package.json`
- Check build command is correct: `npm install && npm run build`

**Backend build fails:**
- Ensure `package.json` has all dependencies
- Check `npm install` completes without errors

## Render.yaml (Infrastructure as Code)

For automated deployments, create `render.yaml` in your repo root:

```yaml
databases:
  - name: newsletter-builder-db
    databaseName: newsletter_builder
    user: newsletter_builder_user
    plan: starter

services:
  # Backend API
  - type: web
    name: newsletter-builder-api
    runtime: node
    region: oregon
    plan: starter
    rootDir: server
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: newsletter-builder-db
          property: connectionString
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: PUBLIC_BASE_URL
        value: https://newsletter-builder-api.onrender.com
      - key: CONFIRM_REDIRECT_URL
        value: https://yourdomain.com/newsletter/confirmed
      - key: RESEND_API_KEY
        sync: false  # Add manually in dashboard
      - key: RESEND_FROM
        sync: false  # Add manually in dashboard
      - key: OPENAI_API_KEY
        sync: false  # Add manually in dashboard

  # Frontend Static Site
  - type: web
    name: newsletter-builder-ui
    runtime: static
    region: oregon
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: client/dist
    envVars:
      - key: VITE_API_BASE
        value: https://newsletter-builder-api.onrender.com/api
```

**Note:** `sync: false` means you add these secrets manually via the dashboard (recommended for security).

## Next Steps

Once deployed:

1. **Add authentication** - Admin endpoints currently have no auth (see SUBSCRIPTION_SETUP.md)
2. **Set up monitoring** - Use Render metrics or external tools (Sentry, LogRocket)
3. **Configure domain** - Use custom domains for professional URLs
4. **Create subscribe form** - Add to your website (see SUBSCRIPTION_SETUP.md)
5. **Test email flow** - Subscribe, verify, send test newsletter
6. **Set up analytics** - Track newsletter performance
7. **Enable webhooks** - Get notified of new subscribers (optional)

## Support

- **Render Docs:** https://render.com/docs
- **Render Support:** https://render.com/support
- **Issues:** Create an issue in your GitHub repo
