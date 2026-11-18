import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)) });
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
