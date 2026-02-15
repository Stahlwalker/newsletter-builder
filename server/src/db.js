import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('Missing DATABASE_URL env var.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const query = (text, params) => pool.query(text, params);
