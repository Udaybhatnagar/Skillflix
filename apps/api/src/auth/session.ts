import type { NextFunction, Request, Response } from 'express';
import { pool } from '../db/pool.js';
import { randomToken, tokenHash } from './security.js';
export interface SafeUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: 'USER' | 'SUPER_ADMIN';
  preferred_language: 'en' | 'hi';
  status: string;
  created_at: string;
  verified_at: string | null;
}
const secure = process.env.NODE_ENV === 'production';
const cookieName = secure ? '__Host-skillflix' : 'skillflix_session';
function cookie(req: Request) {
  return req.headers.cookie
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(cookieName + '='))
    ?.slice(cookieName.length + 1);
}
export async function createSession(res: Response, userId: string) {
  const token = randomToken();
  await pool.query(
    "INSERT INTO user_sessions (token_hash,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL '30 days')",
    [tokenHash(token), userId],
  );
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}
export async function clearSession(req: Request, res: Response) {
  const token = cookie(req);
  if (token) await pool.query('DELETE FROM user_sessions WHERE token_hash=$1', [tokenHash(token)]);
  res.clearCookie(cookieName, { httpOnly: true, secure, sameSite: 'lax', path: '/' });
}
export async function currentUser(req: Request): Promise<SafeUser | null> {
  const token = cookie(req);
  if (!token) return null;
  const result = await pool.query<SafeUser>(
    "SELECT u.id,u.full_name,u.email,u.avatar_url,u.role,u.preferred_language,u.status,u.created_at,u.verified_at FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.status='ACTIVE'",
    [tokenHash(token)],
  );
  return result.rows[0] || null;
}
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: 'Sign in required' });
    res.locals.user = user;
    next();
  } catch {
    res.status(503).json({ error: 'Authentication unavailable' });
  }
}
export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if ((res.locals.user as SafeUser | undefined)?.role !== 'SUPER_ADMIN')
    return res.status(403).json({ error: 'Forbidden' });
  next();
}
