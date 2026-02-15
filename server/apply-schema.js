import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get database URL from command line argument
const databaseUrl = process.argv[2];

if (!databaseUrl) {
  console.error('Usage: node apply-schema.js <DATABASE_URL>');
  console.error('Example: node apply-schema.js "postgresql://user:pass@host:5432/dbname"');
  process.exit(1);
}

async function applySchema() {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    // Read and apply main schema
    console.log('\nApplying schema.sql...');
    const schema = fs.readFileSync(join(__dirname, 'src', 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✓ Schema applied successfully');

    // Apply migrations
    const migrations = [
      'src/migrations/add_project_name.sql',
      'src/migrations/add_analytics.sql'
    ];

    for (const migration of migrations) {
      const path = join(__dirname, migration);
      if (fs.existsSync(path)) {
        console.log(`\nApplying ${migration}...`);
        const sql = fs.readFileSync(path, 'utf8');
        await client.query(sql);
        console.log(`✓ ${migration} applied successfully`);
      }
    }

    console.log('\n✅ All done! Database is ready.');

  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
