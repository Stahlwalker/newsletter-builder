import { query } from '../db.js';

export const startScheduler = ({ onSend }) => {
  const intervalMs = 60 * 1000;

  const tick = async () => {
    try {
      const { rows } = await query(
        `SELECT * FROM newsletters
         WHERE status = 'scheduled'
           AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC`
      );

      if (rows.length > 0) {
        console.log(`📬 Found ${rows.length} newsletter(s) ready to send`);
      }

      for (const newsletter of rows) {
        await onSend(newsletter);
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  };

  console.log('📅 Scheduler started, checking every minute for scheduled newsletters');
  tick(); // Check immediately on startup
  return setInterval(tick, intervalMs);
};
