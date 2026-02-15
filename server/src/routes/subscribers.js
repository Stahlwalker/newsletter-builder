import express from 'express';
import { query } from '../db.js';
import { sendWithResend } from '../services/resend.js';
import crypto from 'crypto';

const router = express.Router();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const rateState = new Map();

const isValidEmail = (email) => /.+@.+\..+/.test(email);
const isValidName = (name) => typeof name === 'string' && name.trim().length > 0 && name.length <= 120;
const tokenTtlMinutes = 60 * 24;

const getBaseUrl = (req) => {
  const envUrl = process.env.PUBLIC_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
};

const rateLimit = (req, res, next) => {
  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const entry = rateState.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  entry.count += 1;
  rateState.set(key, entry);

  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }

  next();
};

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM subscribers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const { rows } = await query(
      `INSERT INTO subscribers (email, name)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [email, name]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/subscribe', rateLimit, async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    if (!isValidName(name)) {
      return res.status(400).json({ error: 'Name required' });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + tokenTtlMinutes * 60 * 1000);
    const { rows } = await query(
      `INSERT INTO subscribers (email, name, verification_token, verification_expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         verification_token = $3,
         verification_expires_at = $4,
         verified_at = NULL
       RETURNING id, email, name, verification_token`,
      [email.trim().toLowerCase(), name.trim(), token, expiresAt]
    );

    const baseUrl = getBaseUrl(req);
    const verifyUrl = `${baseUrl}/api/subscribers/subscribe/verify?token=${rows[0].verification_token}`;

    await sendWithResend({
      subject: 'Confirm your subscription',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Inter, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
    .header { padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-align: center; }
    .header-title { font-family: 'Fira Code', monospace; font-size: 24px; font-weight: 700; color: #ffffff; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .content { padding: 32px 32px; }
    .greeting { font-size: 16px; line-height: 1.6; color: #111827; margin: 0 0 16px 0; }
    .message { font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 24px 0; }
    .button-container { text-align: center; margin: 32px 0; }
    .confirm-button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); transition: transform 0.2s ease; }
    .confirm-button:hover { transform: translateY(-2px); }
    .footer-note { font-size: 14px; color: #6b7280; margin: 24px 0 0 0; line-height: 1.5; }
    .footer { padding: 24px 32px; background: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer-text { font-size: 13px; color: #6b7280; margin: 0; }

    @media only screen and (max-width: 600px) {
      body { padding: 10px !important; }
      .header { padding: 24px 20px 20px 20px !important; }
      .header-title { font-size: 20px !important; }
      .content { padding: 24px 20px !important; }
      .greeting, .message { font-size: 15px !important; }
      .confirm-button { padding: 12px 24px !important; font-size: 15px !important; }
      .footer { padding: 20px !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-title">The Newsletter Builder</h1>
    </div>

    <div class="content">
      <p class="greeting">Hi ${rows[0].name},</p>
      <p class="message">Thanks for subscribing to The Newsletter Builder newsletter. Click the button below to confirm your subscription:</p>

      <div class="button-container">
        <a href="${verifyUrl}" class="confirm-button">Confirm Subscription</a>
      </div>

      <p class="footer-note">This link expires in 24 hours. If you didn't subscribe, you can safely ignore this email.</p>
    </div>

    <div class="footer">
      <p class="footer-text">The Newsletter Builder &copy; ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
      `,
      to: rows[0].email,
      from: process.env.RESEND_FROM,
      apiKey: process.env.RESEND_API_KEY
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/subscribe/verify', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const { rows } = await query(
      `UPDATE subscribers
       SET verified_at = NOW(),
           verification_token = NULL,
           verification_expires_at = NULL
       WHERE verification_token = $1
         AND verification_expires_at > NOW()
       RETURNING id, email, name, verified_at`,
      [token]
    );

    if (!rows[0]) {
      return res.status(400).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation Failed</title>
  <style>
    body { margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Inter, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: 'Fira Code', monospace; font-size: 24px; color: #111827; margin: 0 0 16px 0; }
    p { font-size: 16px; line-height: 1.6; color: #374151; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Confirmation Failed</h1>
    <p>This confirmation link is invalid or has expired.</p>
    <p style="margin-top: 16px;">Please subscribe again to receive a fresh link.</p>
  </div>
</body>
</html>
      `);
    }

    const redirectUrl = process.env.CONFIRM_REDIRECT_URL;
    console.log('[VERIFY] CONFIRM_REDIRECT_URL env var:', redirectUrl);
    if (redirectUrl) {
      console.log('[VERIFY] Redirecting to:', redirectUrl);
      return res.redirect(302, redirectUrl);
    }
    console.log('[VERIFY] No redirect URL, showing default page');

    return res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmed</title>
  <style>
    body { margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Inter, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: 'Fira Code', monospace; font-size: 24px; color: #111827; margin: 0 0 16px 0; }
    p { font-size: 16px; line-height: 1.6; color: #374151; margin: 0; }
    .gradient-text { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1 class="gradient-text">Thanks for confirming!</h1>
    <p>You're now subscribed to The Newsletter Builder newsletter.</p>
    <p style="margin-top: 16px; color: #6b7280;">You'll receive the next edition in your inbox.</p>
  </div>
</body>
</html>
    `);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (!name) return res.status(400).json({ error: 'Name required' });

    const { rows } = await query(
      `UPDATE subscribers
       SET email = $1, name = $2
       WHERE id = $3
       RETURNING *`,
      [email.trim().toLowerCase(), name.trim(), req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM subscribers WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Generate unsubscribe token
function generateUnsubscribeToken(subscriberId, email) {
  const secret = process.env.RESEND_API_KEY || 'fallback-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(`${subscriberId}:${email}`)
    .digest('hex')
    .substring(0, 32);
}

// Unsubscribe endpoint
router.get('/unsubscribe', async (req, res, next) => {
  try {
    const { id, token } = req.query;
    if (!id || !token) {
      return res.status(400).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invalid Unsubscribe Link</title>
  <style>
    body { margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Inter, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: 'Fira Code', monospace; font-size: 24px; color: #111827; margin: 0 0 16px 0; }
    p { font-size: 16px; line-height: 1.6; color: #374151; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Invalid Link</h1>
    <p>This unsubscribe link is invalid or incomplete.</p>
  </div>
</body>
</html>
      `);
    }

    // Get subscriber
    const { rows } = await query('SELECT * FROM subscribers WHERE id = $1', [id]);
    if (!rows[0]) {
      return res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscriber Not Found</title>
  <style>
    body { margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Inter, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: 'Fira Code', monospace; font-size: 24px; color: #111827; margin: 0 0 16px 0; }
    p { font-size: 16px; line-height: 1.6; color: #374151; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❓</div>
    <h1>Already Unsubscribed</h1>
    <p>You've already been unsubscribed or this email was never subscribed.</p>
  </div>
</body>
</html>
      `);
    }

    // Verify token
    const validToken = generateUnsubscribeToken(rows[0].id, rows[0].email);
    if (token !== validToken) {
      return res.status(403).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invalid Token</title>
  <style>
    body { margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Inter, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: 'Fira Code', monospace; font-size: 24px; color: #111827; margin: 0 0 16px 0; }
    p { font-size: 16px; line-height: 1.6; color: #374151; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔒</div>
    <h1>Invalid Token</h1>
    <p>This unsubscribe link is invalid or has been tampered with.</p>
  </div>
</body>
</html>
      `);
    }

    // Delete subscriber
    await query('DELETE FROM subscribers WHERE id = $1', [id]);

    return res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed Successfully</title>
  <style>
    body { margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Inter, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: 'Fira Code', monospace; font-size: 24px; color: #111827; margin: 0 0 16px 0; }
    p { font-size: 16px; line-height: 1.6; color: #374151; margin: 0; }
    .link { color: #60a5fa; text-decoration: none; margin-top: 24px; display: inline-block; }
    .link:hover { color: #3b82f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">👋</div>
    <h1>Successfully Unsubscribed</h1>
    <p>You've been unsubscribed from The Newsletter Builder newsletter.</p>
    <p style="margin-top: 16px; color: #6b7280;">Sorry to see you go! You won't receive any more emails from us.</p>
    <a href="https://yourdomain.com" class="link">Visit yourdomain.com</a>
  </div>
</body>
</html>
    `);
  } catch (err) {
    next(err);
  }
});

export { generateUnsubscribeToken };
export default router;
