import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { emailConfigured, sendAuthEmail } from './mail.js';
import { clearSession, createSession, currentUser, requireUser } from './session.js';
import { hashPassword, randomToken, tokenHash, verifyPassword } from './security.js';
import { webOrigin } from '../config/origin.js';
const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
});
const email = z
  .email()
  .max(254)
  .transform((x) => x.toLowerCase().trim());
const password = z.string().min(10).max(128);
const signup = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((x) => x.password === x.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
const frontend = () => webOrigin;
const safeUserQuery =
  'SELECT id,full_name,email,avatar_url,role,preferred_language,status,created_at,verified_at FROM users WHERE id=$1';
async function issueToken(
  userId: string,
  purpose: 'verify_email' | 'reset_password',
  minutes: number,
) {
  const token = randomToken();
  await pool.query(
    "INSERT INTO auth_tokens (token_hash,user_id,purpose,expires_at) VALUES ($1,$2,$3,NOW()+($4::text||' minutes')::interval)",
    [tokenHash(token), userId, purpose, minutes],
  );
  return token;
}
router.get('/me', async (req, res) => {
  try {
    res.json({
      user: await currentUser(req),
      googleEnabled: !!process.env.GOOGLE_CLIENT_ID,
      emailDeliveryEnabled: emailConfigured(),
    });
  } catch {
    res.status(503).json({ error: 'Authentication unavailable' });
  }
});
router.post('/signup', limiter, async (req, res) => {
  const parsed = signup.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const { fullName, email: address, password: secret } = parsed.data;
  try {
    const id = randomUUID();
    const hash = await hashPassword(secret);
    await pool.query(
      'INSERT INTO users (id,full_name,email,password_hash,verified_at) VALUES ($1,$2,$3,$4,$5)',
      [id, fullName, address, hash, emailConfigured() ? null : new Date()],
    );
    if (emailConfigured()) {
      const token = await issueToken(id, 'verify_email', 1440);
      await sendAuthEmail(
        address,
        'Verify your Skillflix email',
        `${frontend()}/auth/callback?purpose=verify&token=${encodeURIComponent(token)}`,
      );
    }
    await createSession(res, id);
    const user = await pool.query(safeUserQuery, [id]);
    res.status(201).json({ user: user.rows[0] });
  } catch (error) {
    if ((error as { code?: string }).code === '23505')
      return res.status(409).json({ error: 'Email is already registered' });
    res.status(500).json({ error: 'Unable to create account' });
  }
});
router.post('/login', limiter, async (req, res) => {
  const parsed = z.object({ email, password: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  try {
    const result = await pool.query(
      'SELECT id,password_hash,status FROM users WHERE LOWER(email)=$1',
      [parsed.data.email],
    );
    const user = result.rows[0];
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      !(await verifyPassword(parsed.data.password, user.password_hash))
    )
      return res.status(401).json({ error: 'Invalid email or password' });
    await createSession(res, user.id);
    await pool.query('UPDATE users SET last_active_at=NOW() WHERE id=$1', [user.id]);
    const safe = await pool.query(safeUserQuery, [user.id]);
    res.json({ user: safe.rows[0] });
  } catch {
    res.status(500).json({ error: 'Unable to sign in' });
  }
});
router.post('/google', limiter, async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID)
    return res.status(503).json({ error: 'Google sign-in is not configured' });
  const parsed = z.object({ credential: z.string().min(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid credential' });
  try {
    const ticket = await new OAuth2Client(process.env.GOOGLE_CLIENT_ID).verifyIdToken({
      idToken: parsed.data.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified)
      return res.status(401).json({ error: 'Google email not verified' });
    const address = payload.email.toLowerCase();
    let result = await pool.query(
      'SELECT id,auth_provider_id,status FROM users WHERE LOWER(email)=$1',
      [address],
    );
    let id: string;
    if (result.rows[0]) {
      if (
        result.rows[0].status !== 'ACTIVE' ||
        (result.rows[0].auth_provider_id && result.rows[0].auth_provider_id !== payload.sub)
      )
        return res.status(403).json({ error: 'Account unavailable' });
      id = result.rows[0].id;
      await pool.query(
        'UPDATE users SET auth_provider_id=$2,verified_at=COALESCE(verified_at,NOW()),avatar_url=COALESCE(avatar_url,$3),last_active_at=NOW() WHERE id=$1',
        [id, payload.sub, payload.picture || null],
      );
    } else {
      id = randomUUID();
      await pool.query(
        'INSERT INTO users (id,auth_provider_id,full_name,email,avatar_url,verified_at) VALUES ($1,$2,$3,$4,$5,NOW())',
        [id, payload.sub, payload.name || address.split('@')[0], address, payload.picture || null],
      );
    }
    await createSession(res, id);
    result = await pool.query(safeUserQuery, [id]);
    res.json({ user: result.rows[0] });
  } catch {
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});
router.post('/logout', async (req, res) => {
  try {
    await clearSession(req, res);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Unable to sign out' });
  }
});
router.post('/forgot-password', limiter, async (req, res) => {
  const parsed = z.object({ email }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email' });
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE LOWER(email)=$1 AND password_hash IS NOT NULL',
      [parsed.data.email],
    );
    if (result.rows[0] && emailConfigured()) {
      const token = await issueToken(result.rows[0].id, 'reset_password', 30);
      await sendAuthEmail(
        parsed.data.email,
        'Reset your Skillflix password',
        `${frontend()}/auth/callback?purpose=reset&token=${encodeURIComponent(token)}`,
      );
    }
    res.json({
      message: 'If the account exists and email is configured, a reset link has been sent.',
    });
  } catch {
    res.status(500).json({ error: 'Unable to process request' });
  }
});
router.post('/reset-password', limiter, async (req, res) => {
  const parsed = z
    .object({ token: z.string().min(20), password, confirmPassword: z.string() })
    .refine((x) => x.password === x.confirmPassword)
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid reset request' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      "SELECT user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='reset_password' AND used_at IS NULL AND expires_at>NOW() FOR UPDATE",
      [tokenHash(parsed.data.token)],
    );
    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Reset link is invalid or expired' });
    }
    const hash = await hashPassword(parsed.data.password);
    await client.query('UPDATE users SET password_hash=$2,updated_at=NOW() WHERE id=$1', [
      result.rows[0].user_id,
      hash,
    ]);
    await client.query('UPDATE auth_tokens SET used_at=NOW() WHERE token_hash=$1', [
      tokenHash(parsed.data.token),
    ]);
    await client.query('DELETE FROM user_sessions WHERE user_id=$1', [result.rows[0].user_id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Unable to reset password' });
  } finally {
    client.release();
  }
});
router.post('/verify-email', limiter, async (req, res) => {
  const parsed = z.object({ token: z.string().min(20) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid token' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      "SELECT user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='verify_email' AND used_at IS NULL AND expires_at>NOW() FOR UPDATE",
      [tokenHash(parsed.data.token)],
    );
    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Link is invalid or expired' });
    }
    await client.query('UPDATE users SET verified_at=NOW() WHERE id=$1', [result.rows[0].user_id]);
    await client.query('UPDATE auth_tokens SET used_at=NOW() WHERE token_hash=$1', [
      tokenHash(parsed.data.token),
    ]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Unable to verify email' });
  } finally {
    client.release();
  }
});
router.patch('/profile', requireUser, async (req, res) => {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2).max(120),
      preferredLanguage: z.enum(['en', 'hi']),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile data' });
  try {
    const result = await pool.query(
      'UPDATE users SET full_name=$2,preferred_language=$3,updated_at=NOW() WHERE id=$1 RETURNING id,full_name,email,avatar_url,role,preferred_language,status,created_at,verified_at',
      [res.locals.user.id, parsed.data.fullName, parsed.data.preferredLanguage],
    );
    res.json({ user: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'Unable to save profile' });
  }
});
export default router;
