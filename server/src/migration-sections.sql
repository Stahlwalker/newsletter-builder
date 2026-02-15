-- Migration to add sections-based structure
-- This adds new columns while keeping old ones for backwards compatibility

ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS intro_prompt TEXT,
  ADD COLUMN IF NOT EXISTS intro_content TEXT,
  ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS signoff_prompt TEXT,
  ADD COLUMN IF NOT EXISTS signoff_content TEXT;

-- The sections JSONB structure will be:
-- [
--   {
--     "name": "From the blog/Interesting Reads",
--     "items": [
--       {
--         "url": "https://...",
--         "title": "Article Title",
--         "blurb": "AI-generated summary...",
--         "imageUrl": "https://..."
--       }
--     ]
--   },
--   ... other sections
-- ]
