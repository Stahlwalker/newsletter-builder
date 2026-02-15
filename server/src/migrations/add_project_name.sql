-- Add project_name column to newsletters table
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Add intro_prompt, intro_content, sections, signoff_prompt, signoff_content columns if they don't exist
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS intro_prompt TEXT;
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS intro_content TEXT;
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]';
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS signoff_prompt TEXT;
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS signoff_content TEXT;
