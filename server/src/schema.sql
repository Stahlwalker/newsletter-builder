CREATE TABLE IF NOT EXISTS newsletters (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  month TEXT,
  hero_image_url TEXT,
  intro_html TEXT,
  intro_markdown TEXT,
  snippets JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  verified_at TIMESTAMPTZ,
  verification_token TEXT,
  verification_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
