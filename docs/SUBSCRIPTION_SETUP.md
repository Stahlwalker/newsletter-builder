# Subscription Setup Guide

This document explains how to set up the public subscription flow once your Newsletter Builder is deployed to production.

## Overview

The subscription system has two parts:
1. **Newsletter Builder** (this app) - Handles API endpoints, verification emails, and subscriber management
2. **Your Website** (yourdomain.com) - Public-facing subscribe form that posts to the API

## Architecture

```
User visits yourdomain.com/subscribe
  ↓
Fills out form (name + email)
  ↓
Form posts to your-api.com/api/subscribe
  ↓
Server saves subscriber + sends verification email
  ↓
User clicks link in email
  ↓
Server verifies → redirects to yourdomain.com/newsletter/confirmed
```

## Production Deployment Checklist

### 1. Deploy the Newsletter Builder

Deploy this app to your hosting provider (Vercel, Railway, Render, etc.) and note your production URL.

**Update `server/.env` with production values:**

```bash
# Your production API URL (no trailing slash)
PUBLIC_BASE_URL=https://newsletter-api.yourdomain.com

# Resend API key (same as local)
RESEND_API_KEY=re_your_production_key

# Your verified sender email
RESEND_FROM="Newsletter <hello@yourdomain.com>"

# Where to redirect after email confirmation
CONFIRM_REDIRECT_URL=https://yourdomain.com/newsletter/confirmed

# OpenAI for snippet generation
OPENAI_API_KEY=sk-proj-your_key_here

# Production database
DATABASE_URL=postgresql://user:pass@host:5432/newsletter_builder

# Port (optional, most hosts set this)
PORT=5050
```

### 2. Create Subscribe Form on yourdomain.com

Add a subscribe form to your website that posts to your production API.

**Example HTML form:**

```html
<form id="subscribe-form">
  <input
    type="text"
    name="name"
    placeholder="Your name"
    required
  />
  <input
    type="email"
    name="email"
    placeholder="Your email"
    required
  />
  <button type="submit">Subscribe</button>
  <div id="message"></div>
</form>

<script>
document.getElementById('subscribe-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const name = formData.get('name');
  const email = formData.get('email');
  const messageEl = document.getElementById('message');

  try {
    const response = await fetch('https://your-api-url.com/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.textContent = 'Check your email to confirm your subscription!';
      messageEl.style.color = 'green';
      e.target.reset();
    } else {
      messageEl.textContent = data.error || 'Something went wrong';
      messageEl.style.color = 'red';
    }
  } catch (error) {
    messageEl.textContent = 'Failed to subscribe. Please try again.';
    messageEl.style.color = 'red';
  }
});
</script>
```

**Replace:** `https://your-api-url.com` with your actual production API URL.

### 3. Create Confirmation Page

Create a page at `https://yourdomain.com/newsletter/confirmed` that shows:
- Success message
- What to expect (when newsletters are sent)
- Link back to your homepage or newsletter archive

**Example:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Subscription Confirmed</title>
</head>
<body>
  <h1>Thanks for confirming!</h1>
  <p>You're now subscribed to The Newsletter Builder newsletter.</p>
  <p>You'll receive updates when new newsletters are published.</p>
  <a href="/">Back to homepage</a>
</body>
</html>
```

### 4. Verify Resend Domain

In your Resend dashboard:
1. Go to https://resend.com/domains
2. Add and verify `yourdomain.com`
3. Add DNS records (SPF, DKIM, DMARC)
4. Verify the domain is active

This ensures your verification emails don't end up in spam.

## API Endpoints

### Subscribe (Public)

```
POST /api/subscribe
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (200):**
```json
{ "ok": true }
```

**Error (400):**
```json
{ "error": "Valid email required" }
```

**Rate limit:** 20 requests per 15 minutes per IP

### Verify Email (Public)

```
GET /api/subscribe/verify?token=abc-123-def
```

**Success:** Redirects to `CONFIRM_REDIRECT_URL`

**Error:** Shows HTML error page

### List Subscribers (Admin)

```
GET /api/subscribers
```

Returns all subscribers (verified and unverified).

**Note:** This endpoint has no authentication. Add auth middleware before deploying to production.

## Testing the Flow

Before going live:

1. **Deploy to staging** with a test domain
2. **Update `.env`** with staging URLs
3. **Create test form** on staging site
4. **Subscribe with test email**
5. **Check Resend dashboard** for email delivery
6. **Click verification link**
7. **Verify redirect** works to confirmation page
8. **Check admin panel** shows verified subscriber

## Security Considerations

### Add Authentication

The admin endpoints (`/api/subscribers`, `/api/newsletters`) currently have no authentication.

**Before production, add:**
- Basic auth middleware
- JWT tokens
- API keys
- Or restrict by IP/domain

**Example with basic auth:**
```javascript
// server/src/middleware/auth.js
export const basicAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Apply to admin routes
app.use('/api/newsletters', basicAuth, newslettersRouter);
app.use('/api/subscribers', basicAuth, subscribersRouter);
```

### CORS Configuration

Update CORS in production to only allow your domains:

```javascript
// server/src/index.js
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://newsletter-builder.yourdomain.com'
  ],
  credentials: true
}));
```

## Monitoring

Once live, monitor:
- **Resend dashboard** - Email delivery rates, bounces, spam reports
- **Database** - Number of verified vs unverified subscribers
- **Server logs** - Failed subscription attempts, rate limiting
- **Error tracking** - Use Sentry or similar for production errors

## Common Issues

### Verification emails not arriving
- Check Resend dashboard for delivery status
- Verify domain is configured correctly
- Check spam folder
- Ensure `RESEND_FROM` email is verified

### Verification link doesn't work
- Check `PUBLIC_BASE_URL` matches your production API
- Verify token hasn't expired (24 hour TTL)
- Check server logs for errors

### Form submission fails
- Check CORS is configured to allow your domain
- Verify API endpoint URL is correct
- Check network tab for error details
- Verify rate limiting isn't blocking requests

## Next Steps

Once the subscription system is live:
1. Add unsubscribe link to newsletter emails
2. Add analytics tracking (see `server/src/routes/analytics.js`)
3. Create subscriber segments for targeted content
4. Add webhook notifications for new subscribers
5. Build newsletter archive on yourdomain.com
