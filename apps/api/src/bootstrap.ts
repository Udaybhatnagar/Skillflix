import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pool } from './db/pool.js';

function run(relativePath: string) {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL(relativePath, import.meta.url))],
    {
      env: process.env,
      stdio: 'inherit',
    },
  );
  if (result.error || result.status !== 0) throw new Error(`Startup step failed: ${relativePath}`);
}

async function initialize() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in the backend environment');
  const client = await pool.connect();
  let locked = false;
  try {
    // Serialize initialization if the host starts more than one instance.
    await client.query('SELECT pg_advisory_lock(8437191)');
    locked = true;
    run('./db/migrate.js');
    await client.query(`CREATE TABLE IF NOT EXISTS app_bootstrap_history (
      name TEXT PRIMARY KEY, completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const seeded = await client.query(
      "SELECT name FROM app_bootstrap_history WHERE name='initial-content-v1'",
    );
    if (!seeded.rows.length) {
      const existing = await client.query('SELECT COUNT(*) AS count FROM courses');
      if (Number(existing.rows[0].count) === 0) run('./db/seed.js');
      else console.log('Existing content found; initial seed skipped');
      await client.query(
        "INSERT INTO app_bootstrap_history (name) VALUES ('initial-content-v1') ON CONFLICT DO NOTHING",
      );
    }
    const admin = await client.query("SELECT id FROM users WHERE role='SUPER_ADMIN'");
    if (!admin.rows.length && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)
      run('./auth/provision-admin.js');
    else if (!admin.rows.length)
      console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD to provision the first administrator');
    console.log('Database initialization complete');
  } finally {
    if (locked) await client.query('SELECT pg_advisory_unlock(8437191)');
    client.release();
  }
}

try {
  await initialize();
  await import('./index.js');
} catch (error) {
  console.error(
    'Backend startup failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  await pool.end();
  process.exitCode = 1;
}
