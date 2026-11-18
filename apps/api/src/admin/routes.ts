import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAdmin, requireUser } from '../auth/session.js';
const router = Router();
router.use(requireUser, requireAdmin);
const status = z.enum(['Draft', 'Published', 'Archived']);
const slug = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1).max(5000);
const optionalUrl = z
  .union([
    z.url().max(2000),
    z.string().regex(/^\/api\/media\/[0-9a-f-]{36}$/),
    z.literal(''),
    z.null(),
  ])
  .optional();
const courseSchema = z.object({
  kind: z.enum(['exam', 'skill']),
  title: z.string().trim().min(2).max(180),
  slug,
  description: text,
  category: z.string().trim().min(2).max(80),
  difficulty: z.string().trim().min(2).max(80),
  estimated_duration: z.string().max(80).nullable().optional(),
  thumbnail_url: optionalUrl,
  outcomes: z.array(z.string().max(300)).max(30),
  prerequisites: z.array(z.string().max(300)).max(30),
  modules: z.array(z.string().max(200)).max(40),
  guidance: z.string().max(2000),
  status,
});
const teacherSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug,
  kind: z.string().max(80),
  focus: z.string().max(80),
  description: text,
  biography: z.string().max(5000).nullable(),
  image_url: optionalUrl,
  subjects: z.array(z.string().max(100)).max(30),
  languages: z.array(z.string().max(50)).max(10),
  levels: z.array(z.string().max(50)).max(10),
  path_slugs: z.array(z.string().max(100)).max(30),
  channel_url: optionalUrl,
  status,
});
function youtube(value: string, kind: 'Video' | 'Playlist') {
  try {
    const url = new URL(value);
    if (
      !['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname) ||
      url.protocol !== 'https:'
    )
      return null;
    const id =
      kind === 'Video'
        ? url.hostname === 'youtu.be'
          ? url.pathname.slice(1)
          : url.searchParams.get('v')
        : url.searchParams.get('list');
    if (!id || !(kind === 'Video' ? /^[A-Za-z0-9_-]{11}$/ : /^[A-Za-z0-9_-]{10,}$/.test(id)))
      return null;
    return id;
  } catch {
    return null;
  }
}
const resourceSchema = z.object({
  title: z.string().trim().min(2).max(250),
  slug,
  kind: z.enum(['Video', 'Playlist']),
  category: z.string().trim().min(2).max(80),
  language: z.string().trim().min(2).max(50),
  creator: z.string().trim().min(2).max(180),
  url: z.url().max(2000),
  topic: z.string().trim().min(2).max(120),
  level: z.string().trim().min(2).max(80),
  educator_slug: z.string().max(100).nullable().optional(),
  related_slug: z.string().max(100).nullable().optional(),
  review_status: z.enum(['Not reviewed', 'Reviewed']),
  description: z.string().max(3000),
  thumbnail_url: optionalUrl,
  status,
});
const fail = (res: any, error: unknown) =>
  res.status((error as { code?: string }).code === '23505' ? 409 : 500).json({
    error:
      (error as { code?: string }).code === '23505'
        ? 'Slug or email already exists'
        : 'Unable to save changes',
  });
router.get('/dashboard', async (_req, res) => {
  try {
    const [counts, registrations, courses, updated] = await Promise.all([
      pool.query(
        "SELECT (SELECT COUNT(*) FROM users) users,(SELECT COUNT(*) FROM courses) courses,(SELECT COUNT(*) FROM courses WHERE kind='exam') exams,(SELECT COUNT(*) FROM courses WHERE kind='skill') skills,(SELECT COUNT(*) FROM educators) teachers,(SELECT COUNT(*) FROM roadmaps) roadmaps,(SELECT COUNT(*) FROM resources WHERE kind='Video') videos,(SELECT COUNT(*) FROM resources WHERE kind='Playlist') playlists,(SELECT (SELECT COUNT(*) FROM courses WHERE status='Published')+(SELECT COUNT(*) FROM educators WHERE status='Published')+(SELECT COUNT(*) FROM roadmaps WHERE status='Published')+(SELECT COUNT(*) FROM resources WHERE status='Published')) published,(SELECT (SELECT COUNT(*) FROM courses WHERE status='Draft')+(SELECT COUNT(*) FROM educators WHERE status='Draft')+(SELECT COUNT(*) FROM roadmaps WHERE status='Draft')+(SELECT COUNT(*) FROM resources WHERE status='Draft')) drafts",
      ),
      pool.query(
        'SELECT id,full_name,email,created_at FROM users ORDER BY created_at DESC LIMIT 5',
      ),
      pool.query(
        'SELECT id,title,kind,status,created_at FROM courses ORDER BY created_at DESC LIMIT 5',
      ),
      pool.query(
        'SELECT id,title,kind,status,updated_at FROM courses ORDER BY updated_at DESC LIMIT 5',
      ),
    ]);
    res.json({
      counts: counts.rows[0],
      recentRegistrations: registrations.rows,
      recentCourses: courses.rows,
      recentUpdates: updated.rows,
    });
  } catch {
    res.status(500).json({ error: 'Dashboard unavailable' });
  }
});
router.get('/settings', (_req, res) =>
  res.json({
    googleEnabled: !!process.env.GOOGLE_CLIENT_ID,
    emailEnabled: !!process.env.SMTP_HOST,
    youtubeDataApiEnabled: !!process.env.YOUTUBE_API_KEY,
  }),
);
router.get('/users', async (req, res) => {
  const parsed = z
    .object({
      q: z.string().max(100).optional(),
      status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
      page: z.coerce.number().int().min(1).default(1),
    })
    .safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
  const { q = '', status, page } = parsed.data;
  try {
    const [count, items] = await Promise.all([
      pool.query(
        "SELECT COUNT(*) FROM users WHERE ($1='' OR full_name ILIKE '%'||$1||'%' OR email ILIKE '%'||$1||'%') AND ($2::text IS NULL OR status=$2)",
        [q, status || null],
      ),
      pool.query(
        "SELECT id,full_name,email,avatar_url,role,status,created_at,last_active_at FROM users WHERE ($1='' OR full_name ILIKE '%'||$1||'%' OR email ILIKE '%'||$1||'%') AND ($2::text IS NULL OR status=$2) ORDER BY created_at DESC LIMIT 20 OFFSET $3",
        [q, status || null, (page - 1) * 20],
      ),
    ]);
    res.json({ items: items.rows, total: Number(count.rows[0].count), page, pageSize: 20 });
  } catch {
    res.status(500).json({ error: 'Unable to load users' });
  }
});
router.get('/users/:id', async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id,full_name,email,avatar_url,role,status,created_at,last_active_at,preferred_language FROM users WHERE id=$1',
      [req.params.id],
    );
    if (!user.rows[0]) return res.status(404).json({ error: 'Not found' });
    const [saved, topics, lessons] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM user_saved_courses WHERE user_id=$1', [req.params.id]),
      pool.query('SELECT COUNT(*) FROM user_topic_progress WHERE user_id=$1', [req.params.id]),
      pool.query(
        'SELECT COUNT(*) FROM user_lesson_progress WHERE user_id=$1 AND completed_at IS NOT NULL',
        [req.params.id],
      ),
    ]);
    res.json({
      user: user.rows[0],
      summary: {
        savedCourses: Number(saved.rows[0].count),
        completedTopics: Number(topics.rows[0].count),
        completedLessons: Number(lessons.rows[0].count),
      },
    });
  } catch {
    res.status(500).json({ error: 'Unable to load user' });
  }
});
router.patch('/users/:id/status', async (req, res) => {
  const parsed = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });
  try {
    const result = await pool.query(
      "UPDATE users SET status=$2,updated_at=NOW() WHERE id=$1 AND role='USER' RETURNING id,status",
      [req.params.id, parsed.data.status],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found or protected' });
    if (parsed.data.status === 'SUSPENDED')
      await pool.query('DELETE FROM user_sessions WHERE user_id=$1', [req.params.id]);
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Unable to update user' });
  }
});
router.get('/courses', async (_req, res) => {
  try {
    res.json((await pool.query('SELECT * FROM courses ORDER BY updated_at DESC LIMIT 200')).rows);
  } catch {
    res.status(500).json({ error: 'Unable to load courses' });
  }
});
router.post('/courses', async (req, res) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const c = parsed.data;
  try {
    const result = await pool.query(
      'INSERT INTO courses (id,kind,title,slug,description,category,difficulty,estimated_duration,thumbnail_url,outcomes,prerequisites,modules,guidance,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
      [
        randomUUID(),
        c.kind,
        c.title,
        c.slug,
        c.description,
        c.category,
        c.difficulty,
        c.estimated_duration || null,
        c.thumbnail_url || null,
        c.outcomes,
        c.prerequisites,
        c.modules,
        c.guidance,
        c.status,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    fail(res, e);
  }
});
router.put('/courses/:id', async (req, res) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const c = parsed.data;
  try {
    const result = await pool.query(
      'UPDATE courses SET kind=$2,title=$3,slug=$4,description=$5,category=$6,difficulty=$7,estimated_duration=$8,thumbnail_url=$9,outcomes=$10,prerequisites=$11,modules=$12,guidance=$13,status=$14,updated_at=NOW() WHERE id=$1 RETURNING *',
      [
        req.params.id,
        c.kind,
        c.title,
        c.slug,
        c.description,
        c.category,
        c.difficulty,
        c.estimated_duration || null,
        c.thumbnail_url || null,
        c.outcomes,
        c.prerequisites,
        c.modules,
        c.guidance,
        c.status,
      ],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    fail(res, e);
  }
});
router.delete('/courses/:id', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE courses SET status='Archived',updated_at=NOW() WHERE id=$1 RETURNING id,status",
      [req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Unable to archive course' });
  }
});
router.put('/courses/:id/teachers', async (req, res) => {
  const parsed = z.object({ ids: z.array(z.string()).max(30) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid teachers' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM course_teachers WHERE course_id=$1', [req.params.id]);
    for (const id of parsed.data.ids)
      await client.query('INSERT INTO course_teachers (course_id,educator_id) VALUES ($1,$2)', [
        req.params.id,
        id,
      ]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    fail(res, e);
  } finally {
    client.release();
  }
});
router.put('/courses/:id/resources', async (req, res) => {
  const parsed = z.object({ ids: z.array(z.string()).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid resources' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM course_resources WHERE course_id=$1', [req.params.id]);
    for (const id of parsed.data.ids)
      await client.query('INSERT INTO course_resources (course_id,resource_id) VALUES ($1,$2)', [
        req.params.id,
        id,
      ]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    fail(res, e);
  } finally {
    client.release();
  }
});
router.get('/courses/:id/associations', async (req, res) => {
  try {
    const [teachers, resources] = await Promise.all([
      pool.query('SELECT educator_id FROM course_teachers WHERE course_id=$1', [req.params.id]),
      pool.query('SELECT resource_id FROM course_resources WHERE course_id=$1', [req.params.id]),
    ]);
    res.json({
      teacherIds: teachers.rows.map((x) => x.educator_id),
      resourceIds: resources.rows.map((x) => x.resource_id),
    });
  } catch {
    res.status(500).json({ error: 'Unable to load associations' });
  }
});
router.get('/teachers', async (_req, res) => {
  try {
    res.json((await pool.query('SELECT * FROM educators ORDER BY name LIMIT 200')).rows);
  } catch {
    res.status(500).json({ error: 'Unable to load teachers' });
  }
});
router.post('/teachers', async (req, res) => {
  const parsed = teacherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const t = parsed.data;
  try {
    const result = await pool.query(
      'INSERT INTO educators (id,slug,name,kind,focus,description,biography,image_url,subjects,languages,levels,path_slugs,channel_url,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
      [
        randomUUID(),
        t.slug,
        t.name,
        t.kind,
        t.focus,
        t.description,
        t.biography,
        t.image_url || null,
        t.subjects,
        t.languages,
        t.levels,
        t.path_slugs,
        t.channel_url || null,
        t.status,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    fail(res, e);
  }
});
router.put('/teachers/:id', async (req, res) => {
  const parsed = teacherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const t = parsed.data;
  try {
    const result = await pool.query(
      'UPDATE educators SET slug=$2,name=$3,kind=$4,focus=$5,description=$6,biography=$7,image_url=$8,subjects=$9,languages=$10,levels=$11,path_slugs=$12,channel_url=$13,status=$14 WHERE id=$1 RETURNING *',
      [
        req.params.id,
        t.slug,
        t.name,
        t.kind,
        t.focus,
        t.description,
        t.biography,
        t.image_url || null,
        t.subjects,
        t.languages,
        t.levels,
        t.path_slugs,
        t.channel_url || null,
        t.status,
      ],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    fail(res, e);
  }
});
router.delete('/teachers/:id', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE educators SET status='Archived' WHERE id=$1 RETURNING id,status",
      [req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Unable to archive teacher' });
  }
});
router.get('/resources', async (_req, res) => {
  try {
    res.json((await pool.query('SELECT * FROM resources ORDER BY id DESC LIMIT 300')).rows);
  } catch {
    res.status(500).json({ error: 'Unable to load resources' });
  }
});
router.post('/resources', async (req, res) => {
  const parsed = resourceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const r = parsed.data;
  const youtubeId = youtube(r.url, r.kind);
  if (!youtubeId)
    return res.status(400).json({ error: 'Enter a supported YouTube video or playlist URL' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO resources (id,title,slug,kind,category,language,creator,url,topic,level,educator_slug,related_slug,review_status,description,thumbnail_url,status,video_id,playlist_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *',
      [
        randomUUID(),
        r.title,
        r.slug,
        r.kind,
        r.category,
        r.language,
        r.creator,
        r.url,
        r.topic,
        r.level,
        r.educator_slug || null,
        r.related_slug || null,
        r.review_status,
        r.description,
        r.thumbnail_url || null,
        r.status,
        r.kind === 'Video' ? youtubeId : null,
        r.kind === 'Playlist' ? youtubeId : null,
      ],
    );
    if (r.kind === 'Playlist')
      await client.query(
        'INSERT INTO playlists (id,resource_id,youtube_playlist_id,status) VALUES ($1,$2,$3,$4)',
        [result.rows[0].id, result.rows[0].id, youtubeId, r.status],
      );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    fail(res, e);
  } finally {
    client.release();
  }
});
router.put('/resources/:id', async (req, res) => {
  const parsed = resourceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const r = parsed.data;
  const youtubeId = youtube(r.url, r.kind);
  if (!youtubeId)
    return res.status(400).json({ error: 'Enter a supported YouTube video or playlist URL' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'UPDATE resources SET title=$2,slug=$3,kind=$4,category=$5,language=$6,creator=$7,url=$8,topic=$9,level=$10,educator_slug=$11,related_slug=$12,review_status=$13,description=$14,thumbnail_url=$15,status=$16,video_id=$17,playlist_id=$18 WHERE id=$1 RETURNING *',
      [
        req.params.id,
        r.title,
        r.slug,
        r.kind,
        r.category,
        r.language,
        r.creator,
        r.url,
        r.topic,
        r.level,
        r.educator_slug || null,
        r.related_slug || null,
        r.review_status,
        r.description,
        r.thumbnail_url || null,
        r.status,
        r.kind === 'Video' ? youtubeId : null,
        r.kind === 'Playlist' ? youtubeId : null,
      ],
    );
    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    if (r.kind === 'Playlist')
      await client.query(
        'INSERT INTO playlists (id,resource_id,youtube_playlist_id,status) VALUES ($1,$2,$3,$4) ON CONFLICT (resource_id) DO UPDATE SET youtube_playlist_id=EXCLUDED.youtube_playlist_id,status=EXCLUDED.status',
        [req.params.id, req.params.id, youtubeId, r.status],
      );
    else await client.query('DELETE FROM playlists WHERE resource_id=$1', [req.params.id]);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    fail(res, e);
  } finally {
    client.release();
  }
});
router.delete('/resources/:id', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE resources SET status='Archived' WHERE id=$1 RETURNING id,status",
      [req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Unable to archive resource' });
  }
});
router.get('/playlists', async (_req, res) => {
  try {
    res.json(
      (
        await pool.query(
          'SELECT p.id,p.resource_id,p.youtube_playlist_id,p.status,r.title,(SELECT COUNT(*) FROM playlist_videos v WHERE v.playlist_id=p.id) AS lesson_count FROM playlists p JOIN resources r ON r.id=p.resource_id ORDER BY r.title',
        )
      ).rows,
    );
  } catch {
    res.status(500).json({ error: 'Unable to load playlists' });
  }
});
router.get('/playlists/:id/videos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.id,r.title FROM playlist_videos v JOIN resources r ON r.id=v.resource_id WHERE v.playlist_id=$1 ORDER BY v.position',
      [req.params.id],
    );
    res.json({ lessons: result.rows });
  } catch {
    res.status(500).json({ error: 'Unable to load lessons' });
  }
});
router.put('/playlists/:id/videos', async (req, res) => {
  const parsed = z.object({ resourceIds: z.array(z.string()).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid lesson list' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM playlist_videos WHERE playlist_id=$1', [req.params.id]);
    for (const [position, id] of parsed.data.resourceIds.entries()) {
      const result = await client.query(
        "INSERT INTO playlist_videos (id,playlist_id,resource_id,position) SELECT $1,$2,id,$4 FROM resources WHERE id=$3 AND kind='Video' RETURNING id",
        [randomUUID(), req.params.id, id, position],
      );
      if (!result.rows[0]) throw new Error('Invalid video resource');
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: e instanceof Error ? e.message : 'Unable to save playlist' });
  } finally {
    client.release();
  }
});
router.get('/categories', async (_req, res) => {
  try {
    res.json((await pool.query('SELECT * FROM categories ORDER BY name')).rows);
  } catch {
    res.status(500).json({ error: 'Unable to load categories' });
  }
});
router.post('/categories', async (req, res) => {
  const parsed = z
    .object({ id: slug, name: z.string().trim().min(2).max(80), status })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid category' });
  try {
    res
      .status(201)
      .json(
        (
          await pool.query(
            'INSERT INTO categories (id,name,status) VALUES ($1,$2,$3) RETURNING *',
            [parsed.data.id, parsed.data.name, parsed.data.status],
          )
        ).rows[0],
      );
  } catch (e) {
    fail(res, e);
  }
});
router.put('/categories/:id', async (req, res) => {
  const parsed = z.object({ name: z.string().trim().min(2).max(80), status }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid category' });
  try {
    const result = await pool.query(
      'UPDATE categories SET name=$2,status=$3 WHERE id=$1 RETURNING *',
      [req.params.id, parsed.data.name, parsed.data.status],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    fail(res, e);
  }
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(null, ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)),
});
router.post('/uploads', upload.single('image'), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: 'Upload a PNG, JPEG, or WebP image under 2 MB' });
  try {
    const id = randomUUID();
    await pool.query('INSERT INTO media_assets (id,content_type,data) VALUES ($1,$2,$3)', [
      id,
      req.file.mimetype,
      req.file.buffer,
    ]);
    res.status(201).json({ url: `/api/media/${id}` });
  } catch {
    res.status(500).json({ error: 'Unable to upload image' });
  }
});
export default router;
