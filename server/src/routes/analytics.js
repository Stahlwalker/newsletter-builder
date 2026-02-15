import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * GET /api/analytics/newsletter/:id
 * Get analytics for a specific newsletter
 */
router.get('/newsletter/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get event counts by type
    const { rows: eventCounts } = await query(
      `SELECT
        event_type,
        COUNT(*) as count,
        COUNT(DISTINCT subscriber_email) as unique_count
       FROM email_analytics
       WHERE newsletter_id = $1
       GROUP BY event_type`,
      [id]
    );

    // Get clicked URLs with counts
    const { rows: clickedUrls } = await query(
      `SELECT
        event_data->>'url' as url,
        COUNT(*) as click_count,
        COUNT(DISTINCT subscriber_email) as unique_clicks
       FROM email_analytics
       WHERE newsletter_id = $1 AND event_type = 'clicked' AND event_data IS NOT NULL
       GROUP BY event_data->>'url'
       ORDER BY click_count DESC`,
      [id]
    );

    // Get recent events
    const { rows: recentEvents } = await query(
      `SELECT
        event_type,
        subscriber_email,
        event_data,
        created_at
       FROM email_analytics
       WHERE newsletter_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [id]
    );

    // Calculate summary stats
    const stats = {
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
      uniqueOpens: 0,
      uniqueClicks: 0
    };

    eventCounts.forEach(row => {
      stats[row.event_type] = parseInt(row.count);
      if (row.event_type === 'opened') {
        stats.uniqueOpens = parseInt(row.unique_count);
      }
      if (row.event_type === 'clicked') {
        stats.uniqueClicks = parseInt(row.unique_count);
      }
    });

    // Calculate rates
    const openRate = stats.delivered > 0
      ? ((stats.uniqueOpens / stats.delivered) * 100).toFixed(1)
      : '0.0';

    const clickRate = stats.delivered > 0
      ? ((stats.uniqueClicks / stats.delivered) * 100).toFixed(1)
      : '0.0';

    res.json({
      stats,
      openRate,
      clickRate,
      clickedUrls,
      recentEvents
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/overview
 * Get overall analytics across all newsletters
 */
router.get('/overview', async (req, res, next) => {
  try {
    // Get total events by type
    const { rows: totals } = await query(
      `SELECT
        event_type,
        COUNT(*) as count
       FROM email_analytics
       GROUP BY event_type`
    );

    // Get newsletter performance
    const { rows: newsletterStats } = await query(
      `SELECT
        n.id,
        n.title,
        n.sent_at,
        COUNT(CASE WHEN ea.event_type = 'delivered' THEN 1 END) as delivered,
        COUNT(DISTINCT CASE WHEN ea.event_type = 'opened' THEN ea.subscriber_email END) as unique_opens,
        COUNT(DISTINCT CASE WHEN ea.event_type = 'clicked' THEN ea.subscriber_email END) as unique_clicks
       FROM newsletters n
       LEFT JOIN email_analytics ea ON n.id = ea.newsletter_id
       WHERE n.status = 'sent'
       GROUP BY n.id, n.title, n.sent_at
       ORDER BY n.sent_at DESC
       LIMIT 10`
    );

    res.json({
      totals,
      newsletterStats
    });
  } catch (error) {
    next(error);
  }
});

export default router;
