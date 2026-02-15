# Resend Webhook Setup Guide

## Step 1: Expose Your Local Server (for testing)

Since Resend needs to send webhooks to a public URL, you need to expose your local server:

### Option A: Use ngrok (recommended for testing)
```bash
# Install ngrok: https://ngrok.com/download
# Then run:
ngrok http 5050
```

You'll get a public URL like: `https://abc123.ngrok.io`

### Option B: Use Cloudflare Tunnel
```bash
# Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
cloudflared tunnel --url http://localhost:5050
```

## Step 2: Configure Webhook in Resend

1. Go to **https://resend.com/webhooks**
2. Click **"Add Webhook"**
3. Fill in the details:
   - **Endpoint URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/resend`
     (Replace with your actual ngrok/tunnel URL)
   - **Events**: Select these events:
     - ✅ `email.delivered`
     - ✅ `email.opened`
     - ✅ `email.clicked`
     - ✅ `email.bounced`
     - ✅ `email.complained`
   - **Status**: Enabled
4. Click **"Create Webhook"**

## Step 3: Test It

1. Send a test email from your app
2. Open the email
3. Click a link in the email
4. Check your server logs - you should see:
   ```
   📬 Received webhook event: email.delivered
   ✅ Stored delivered event for user@example.com
   📬 Received webhook event: email.opened
   ✅ Stored opened event for user@example.com
   📬 Received webhook event: email.clicked
   ✅ Stored clicked event for user@example.com
   ```

## Step 4: View Analytics

In your app, click on a sent newsletter and go to the **Analytics** tab to see:
- Open rate
- Click rate
- Clicked URLs
- Recent events

## For Production

When you deploy to production (Railway/Render), replace the ngrok URL with your production API URL:
- Example: `https://your-app.railway.app/api/webhooks/resend`
