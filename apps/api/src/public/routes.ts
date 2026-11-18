import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
const router = Router();
router.get('/media/:id', async (req, res) => {
  if (!z.uuid().safeParse(req.params.id).success) return res.status(404).end();
  try {
    const found = await pool.query<{ data: Buffer; content_type: string }>(
      'SELECT data,content_type FROM media_assets WHERE id=$1',
      [req.params.id],
    );
    if (!found.rows[0]) return res.status(404).end();
    res.setHeader('Content-Type', found.rows[0].content_type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(found.rows[0].data);
  } catch {
    res.status(500).end();
  }
});
const filters = z.object({
  q: z.string().max(100).optional(),
  category: z.string().max(60).optional(),
  language: z.string().max(40).optional(),
  sort: z.enum(['title', 'recent']).optional(),
});
const courseFields =
  'id,kind,slug,title,category,difficulty AS level,estimated_duration AS duration,LEFT(description,180) AS summary,description AS overview,outcomes,modules,guidance,thumbnail_url,status';
router.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ error: 'Database unavailable' });
  }
});
router.get('/catalog/:kind', async (req, res) => {
  if (!['exam', 'skill'].includes(req.params.kind))
    return res.status(404).json({ error: 'Not found' });
  const parsed = filters.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
  const { q = '', category = '' } = parsed.data;
  try {
    const result = await pool.query(
      `SELECT ${courseFields} FROM courses WHERE status='Published' AND kind=$1 AND ($2='' OR title ILIKE '%'||$2||'%' OR description ILIKE '%'||$2||'%') AND ($3='' OR category=$3) ORDER BY title LIMIT 100`,
      [req.params.kind, q, category],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Unable to load catalog' });
  }
});
router.get('/catalog/:kind/:slug', async (req, res) => {
  if (!['exam', 'skill'].includes(req.params.kind))
    return res.status(404).json({ error: 'Not found' });
  try {
    const result = await pool.query(
      `SELECT ${courseFields} FROM courses WHERE status='Published' AND kind=$1 AND slug=$2`,
      [req.params.kind, req.params.slug],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Unable to load course' });
  }
});
router.get('/courses', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${courseFields} FROM courses WHERE status='Published' ORDER BY title LIMIT 100`,
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Unable to load courses' });
  }
});
router.get('/resources', async (req, res) => {
  const parsed = filters.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
  const { q = '', category = '', language = '', sort = 'title' } = parsed.data;
  try {
    const result = await pool.query(
      `SELECT * FROM resources WHERE status='Published' AND ($1='' OR title ILIKE '%'||$1||'%' OR creator ILIKE '%'||$1||'%' OR topic ILIKE '%'||$1||'%') AND ($2='' OR category=$2) AND ($3='' OR language=$3) ORDER BY ${sort === 'recent' ? 'id DESC' : 'title ASC'} LIMIT 100`,
      [q, category, language],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Unable to load resources' });
  }
});
router.get('/resources/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM resources WHERE status='Published' AND slug=$1",
      [req.params.slug],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const resource = result.rows[0];
    const lessons =
      resource.kind === 'Playlist'
        ? (
            await pool.query(
              "SELECT r.* FROM playlists p JOIN playlist_videos v ON v.playlist_id=p.id JOIN resources r ON r.id=v.resource_id WHERE p.resource_id=$1 AND r.status='Published' ORDER BY v.position",
              [resource.id],
            )
          ).rows
        : [];
    res.json({ ...resource, lessons });
  } catch {
    res.status(500).json({ error: 'Unable to load resource' });
  }
});
router.get('/educators', async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM educators WHERE status='Published' ORDER BY name LIMIT 100",
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Unable to load educators' });
  }
});
router.get('/educators/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM educators WHERE status='Published' AND slug=$1",
      [req.params.slug],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Unable to load educator' });
  }
});
router.get('/roadmaps', async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT r.id,r.title,r.overview,c.kind AS type,c.slug FROM roadmaps r JOIN courses c ON c.id=r.course_id WHERE r.status='Published' AND c.status='Published' ORDER BY r.title",
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Unable to load roadmaps' });
  }
});
router.get('/roadmaps/:type/:slug', async (req, res) => {
  if (!['exam', 'skill'].includes(req.params.type))
    return res.status(404).json({ error: 'Not found' });
  try {
    const found = await pool.query(
      "SELECT r.id,r.title,r.overview,c.kind AS type,c.slug FROM roadmaps r JOIN courses c ON c.id=r.course_id WHERE r.status='Published' AND c.status='Published' AND c.kind=$1 AND c.slug=$2",
      [req.params.type, req.params.slug],
    );
    if (!found.rows[0]) return res.status(404).json({ error: 'Not found' });
    const roadmap = found.rows[0];
    const [stages, topics, resources] = await Promise.all([
      pool.query(
        'SELECT id,title,description,position FROM roadmap_stages WHERE roadmap_id=$1 ORDER BY position',
        [roadmap.id],
      ),
      pool.query(
        'SELECT t.id,t.stage_id,t.title,t.description,t.hours,t.prerequisites,t.position FROM roadmap_topics t JOIN roadmap_stages s ON s.id=t.stage_id WHERE s.roadmap_id=$1 ORDER BY s.position,t.position',
        [roadmap.id],
      ),
      pool.query(
        'SELECT tr.topic_id,tr.resource_id FROM topic_resources tr JOIN roadmap_topics t ON t.id=tr.topic_id JOIN roadmap_stages s ON s.id=t.stage_id WHERE s.roadmap_id=$1',
        [roadmap.id],
      ),
    ]);
    res.json({
      ...roadmap,
      stages: stages.rows.map((stage) => ({
        id: stage.id,
        title: stage.title,
        description: stage.description,
        topics: topics.rows
          .filter((t) => t.stage_id === stage.id)
          .map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            hours: Number(t.hours),
            prerequisites: t.prerequisites,
            resourceIds: resources.rows
              .filter((r) => r.topic_id === t.id)
              .map((r) => r.resource_id),
          })),
      })),
    });
  } catch {
    res.status(500).json({ error: 'Unable to load roadmap' });
  }
});
router.get('/search', async (req, res) => {
  const parsed = z
    .object({
      q: z.string().trim().min(1).max(100),
      category: z.string().max(60).optional(),
      language: z.string().max(40).optional(),
      sort: z.enum(['title', 'recent']).optional(),
    })
    .safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a search term' });
  const { q, category = '', language = '', sort = 'title' } = parsed.data;
  const order = sort === 'recent' ? 'id DESC' : 'title ASC';
  try {
    const [catalog, resources, educators, topics] = await Promise.all([
      pool.query(
        `SELECT ${courseFields} FROM courses WHERE status='Published' AND (title ILIKE '%'||$1||'%' OR description ILIKE '%'||$1||'%') AND ($2='' OR category=$2) ORDER BY ${order} LIMIT 30`,
        [q, category],
      ),
      pool.query(
        `SELECT * FROM resources WHERE status='Published' AND (title ILIKE '%'||$1||'%' OR creator ILIKE '%'||$1||'%' OR topic ILIKE '%'||$1||'%') AND ($2='' OR category=$2) AND ($3='' OR language=$3) ORDER BY ${order} LIMIT 30`,
        [q, category, language],
      ),
      pool.query(
        "SELECT * FROM educators WHERE status='Published' AND (name ILIKE '%'||$1||'%' OR focus ILIKE '%'||$1||'%') ORDER BY name LIMIT 20",
        [q],
      ),
      pool.query(
        "SELECT t.id,t.title,t.description,c.kind AS type,c.slug FROM roadmap_topics t JOIN roadmap_stages s ON s.id=t.stage_id JOIN roadmaps r ON r.id=s.roadmap_id JOIN courses c ON c.id=r.course_id WHERE r.status='Published' AND c.status='Published' AND (t.title ILIKE '%'||$1||'%' OR t.description ILIKE '%'||$1||'%') ORDER BY t.title LIMIT 30",
        [q],
      ),
    ]);
    res.json({
      catalog: catalog.rows,
      resources: resources.rows,
      educators: educators.rows,
      topics: topics.rows,
    });
  } catch {
    res.status(500).json({ error: 'Search unavailable' });
  }
});
export default router;
