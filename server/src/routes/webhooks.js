import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * POST /api/webhooks/resend
 * Webhook endpoint for Resend email events
 * Handles: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
 */
router.post('/resend', async (req, res) => {
  try {
    const event = req.body;

    console.log('📬 Received webhook event:', event.type);

    // Extract common fields
    const { type, data } = event;

    if (!type || !data) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Extract newsletter_id from tags (tags is an object, not an array)
    const newsletterId = data.tags?.newsletter_id;
    const subscriberEmail = data.to;
    const resendEmailId = data.email_id;

    // Map Resend event types to our event types
    const eventTypeMap = {
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.delivery_delayed': 'delayed'
    };

    const eventType = eventTypeMap[type];

    if (!eventType) {
      console.log(`⚠️ Ignoring event type: ${type}`);
      return res.status(200).json({ received: true });
    }

    // Prepare event data
    const eventData = {};

    // For clicks, store the clicked URL
    if (type === 'email.clicked' && data.click) {
      eventData.url = data.click.link;
    }

    // For bounces, store bounce info
    if (type === 'email.bounced' && data.bounce) {
      eventData.bounceType = data.bounce.type;
      eventData.bounceMessage = data.bounce.message;
    }

    // Store the event in database
    await query(
      `INSERT INTO email_analytics
       (newsletter_id, subscriber_email, event_type, event_data, resend_email_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        newsletterId ? parseInt(newsletterId) : null,
        subscriberEmail,
        eventType,
        Object.keys(eventData).length > 0 ? JSON.stringify(eventData) : null,
        resendEmailId
      ]
    );

    console.log(`✅ Stored ${eventType} event for ${subscriberEmail}`);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
