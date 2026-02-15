import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import newslettersRouter from './routes/newsletters.js';
import subscribersRouter from './routes/subscribers.js';
import aiRouter from './routes/ai.js';
import emailRouter from './routes/email.js';
import webhooksRouter from './routes/webhooks.js';
import analyticsRouter from './routes/analytics.js';
import { startScheduler } from './services/scheduler.js';
import { sendNewsletterToSubscribers } from './services/email.js';
import { query } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/public', express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/newsletters', newslettersRouter);
app.use('/api/subscribers', subscribersRouter);
app.use('/api/ai', aiRouter);
app.use('/api/email', emailRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/analytics', analyticsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const sendNewsletter = async (newsletter) => {
  try {
    console.log(`Sending scheduled newsletter ${newsletter.id}: ${newsletter.title}`);

    // Get all verified subscribers
    const { rows: subscriberRows } = await query(
      'SELECT * FROM subscribers WHERE verified_at IS NOT NULL'
    );

    if (subscriberRows.length === 0) {
      console.log(`No verified subscribers for newsletter ${newsletter.id}`);
      return;
    }

    // Send the newsletter
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

    // Update newsletter status to sent
    await query(
      `UPDATE newsletters
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [newsletter.id]
    );

    console.log(`Newsletter ${newsletter.id} sent to ${result.successful} subscribers (${result.failed} failed)`);
  } catch (error) {
    console.error(`Failed to send scheduled newsletter ${newsletter.id}:`, error);
  }
};

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
  startScheduler({ onSend: sendNewsletter });
});
