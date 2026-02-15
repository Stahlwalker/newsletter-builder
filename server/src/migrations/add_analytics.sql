-- Create email_analytics table to track opens, clicks, and other email events
CREATE TABLE IF NOT EXISTS email_analytics (
  id SERIAL PRIMARY KEY,
  newsletter_id INTEGER REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_email VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'delivered', 'opened', 'clicked', 'bounced', 'complained'
  event_data JSONB, -- Additional data like clicked URL
  resend_email_id VARCHAR(255), -- Resend's email ID for reference
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_email_analytics_newsletter ON email_analytics(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_email ON email_analytics(subscriber_email);
CREATE INDEX IF NOT EXISTS idx_email_analytics_event_type ON email_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_email_analytics_created_at ON email_analytics(created_at);
