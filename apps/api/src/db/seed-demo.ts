import { randomBytes, randomUUID } from 'node:crypto';
import { pool } from './pool.js';
import { hashPassword } from '../auth/security.js';

const connection = process.env.DATABASE_URL;
if (!connection) throw new Error('DATABASE_URL is required');
const host = new URL(connection).hostname;
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '::1'].includes(host))
  throw new Error('Demo accounts may only be seeded into a local, non-production database');

const accounts = [
  { name: 'Demo Administrator', email: 'admin@skillflix.local', role: 'SUPER_ADMIN' as const },
  { name: 'Aarav Learner', email: 'aarav@skillflix.local', role: 'USER' as const },
  { name: 'Meera Learner', email: 'meera@skillflix.local', role: 'USER' as const },
];

async function upsertDemoAccount(account: (typeof accounts)[number]) {
  if (account.role === 'SUPER_ADMIN') {
    const admin = await pool.query<{ email: string }>(
      "SELECT email FROM users WHERE role='SUPER_ADMIN'",
    );
    if (admin.rows[0] && admin.rows[0].email !== account.email) {
      console.log(`Admin already exists (${admin.rows[0].email}); demo admin was not created.`);
      return null;
    }
  }
  const password = `${randomBytes(18).toString('base64url')}!Aa9`;
  const hash = await hashPassword(password);
  const result = await pool.query<{ id: string }>(
    `INSERT INTO users (id,full_name,email,password_hash,role,verified_at)
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT (LOWER(email)) DO UPDATE SET
       full_name=EXCLUDED.full_name,password_hash=EXCLUDED.password_hash,role=EXCLUDED.role,
       status='ACTIVE',verified_at=NOW(),updated_at=NOW()
     RETURNING id`,
    [randomUUID(), account.name, account.email, hash, account.role],
  );
  await pool.query('DELETE FROM user_sessions WHERE user_id=$1', [result.rows[0].id]);
  return { ...account, id: result.rows[0].id, password };
}

try {
  const seeded = [];
  for (const account of accounts) {
    const created = await upsertDemoAccount(account);
    if (created) seeded.push(created);
  }
  const course = await pool.query<{ id: string }>(
    "SELECT id FROM courses WHERE kind='skill' AND slug='ui-ux-design' AND status='Published'",
  );
  const roadmap = await pool.query<{ id: string }>(
    "SELECT id FROM roadmaps WHERE id='skill:ui-ux-design' AND status='Published'",
  );
  const topic = await pool.query<{ id: string }>(
    `SELECT t.id FROM roadmap_topics t JOIN roadmap_stages s ON s.id=t.stage_id
     WHERE s.roadmap_id='skill:ui-ux-design' ORDER BY s.position,t.position LIMIT 1`,
  );
  if (!course.rows[0] || !roadmap.rows[0] || !topic.rows[0])
    throw new Error('Run npm run db:seed before seeding demo accounts');
  for (const account of seeded.filter((x) => x.role === 'USER')) {
    await pool.query(
      'INSERT INTO user_saved_courses (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [account.id, course.rows[0].id],
    );
    await pool.query(
      'INSERT INTO user_saved_roadmaps (user_id,roadmap_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [account.id, roadmap.rows[0].id],
    );
    await pool.query(
      'INSERT INTO user_bookmarks (user_id,resource_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [account.id, 'res-figma'],
    );
  }
  const learner = seeded.find((x) => x.email === 'aarav@skillflix.local');
  if (learner) {
    await pool.query(
      'INSERT INTO user_topic_progress (user_id,topic_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [learner.id, topic.rows[0].id],
    );
    await pool.query(
      'INSERT INTO user_lesson_progress (user_id,resource_id,last_position_seconds) VALUES ($1,$2,$3) ON CONFLICT (user_id,resource_id) DO UPDATE SET last_position_seconds=EXCLUDED.last_position_seconds',
      [learner.id, 'res-figma', 45],
    );
  }
  console.log('Demo sign-ins (local database only; rerunning rotates passwords):');
  for (const account of seeded)
    console.log(`${account.role.padEnd(11)} ${account.email.padEnd(26)} ${account.password}`);
} finally {
  await pool.end();
}
