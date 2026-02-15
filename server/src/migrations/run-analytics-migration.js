import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = fs.readFileSync(join(__dirname, 'add_analytics.sql'), 'utf8');

try {
  await query(sql);
  console.log('✅ Analytics migration completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
