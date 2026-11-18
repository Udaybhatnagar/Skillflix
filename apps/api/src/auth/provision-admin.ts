import { randomUUID } from 'node:crypto';
import { pool } from '../db/pool.js';
import { hashPassword } from './security.js';
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME?.trim() || 'Skillflix Administrator';
if (!email || !password || password.length < 16)
  throw new Error(
    'Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters) in server environment',
  );
try {
  const existing = await pool.query("SELECT id,email FROM users WHERE role='SUPER_ADMIN'");
  if (existing.rows.length) {
    console.log('Super Admin already exists; no changes made');
    process.exitCode = 1;
  } else {
    const hash = await hashPassword(password);
    await pool.query(
      "INSERT INTO users (id,full_name,email,password_hash,role,verified_at) VALUES ($1,$2,$3,$4,'SUPER_ADMIN',NOW())",
      [randomUUID(), fullName, email, hash],
    );
    console.log('Super Admin provisioned');
  }
} finally {
  await pool.end();
}
