import express from 'express';
import { query } from '../db.js';
import { renderNewsletterForPreview, sendNewsletterToSubscribers, sendTestEmail } from '../services/email.js';

const router = express.Router();

/**
 * GET /api/email/preview/:id
 * Preview newsletter email HTML
 */
router.get('/preview/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM newsletters WHERE id = $1', [req.params.id]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }

    const newsletter = rows[0];

    const emailHtml = await renderNewsletterForPreview({
      title: newsletter.title,
      month: newsletter.month,
      heroImageUrl: newsletter.hero_image_url,
      introContent: newsletter.intro_content,
      sections: newsletter.sections || [],
      signoffContent: newsletter.signoff_content
    });

    // Return HTML for preview
    res.setHeader('Content-Type', 'text/html');
    res.send(emailHtml);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/email/test/:id
 * Send test email to specified address
 * Body: { email: string }
 */
router.post('/test/:id', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const { rows } = await query('SELECT * FROM newsletters WHERE id = $1', [req.params.id]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }

    const newsletter = rows[0];

    const result = await sendTestEmail(
      {
        id: newsletter.id,
        title: newsletter.title,
        month: newsletter.month,
        heroImageUrl: newsletter.hero_image_url,
        introContent: newsletter.intro_content,
        sections: newsletter.sections || [],
        signoffContent: newsletter.signoff_content
      },
      email
    );

    res.json({
      success: true,
      message: `Test email sent to ${email}`,
      result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/email/send/:id
 * Send newsletter to all verified subscribers
 */
router.post('/send/:id', async (req, res, next) => {
  try {
    const { rows: newsletterRows } = await query('SELECT * FROM newsletters WHERE id = $1', [req.params.id]);

    if (!newsletterRows[0]) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }

    const newsletter = newsletterRows[0];

    // Get all verified subscribers
    const { rows: subscriberRows } = await query(
      'SELECT * FROM subscribers WHERE verified_at IS NOT NULL'
    );

    if (subscriberRows.length === 0) {
      return res.status(400).json({ error: 'No verified subscribers found' });
    }

    const result = await sendNewsletterToSubscribers(
      {
        id: newsletter.id,
        title: newsletter.title,
        month: newsletter.month,
        heroImageUrl: newsletter.hero_image_url,
        introContent: newsletter.intro_content,
        sections: newsletter.sections || [],
        signoffContent: newsletter.signoff_content
      },
      subscriberRows
    );

    // Update newsletter status
    await query(
      `UPDATE newsletters
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [newsletter.id]
    );

    res.json({
      success: true,
      message: `Newsletter sent to ${result.successful} subscribers`,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
