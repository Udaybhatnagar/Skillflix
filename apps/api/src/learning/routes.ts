import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireUser } from '../auth/session.js';
const router = Router();
router.use(requireUser);
const idSchema = z.object({ id: z.string().min(1).max(150) });
router.get('/', async (_req, res) => {
  const userId = res.locals.user.id;
  try {
    const [bookmarks, savedRoadmaps, savedCourses, topics, lessons, activity] = await Promise.all([
      pool.query('SELECT resource_id FROM user_bookmarks WHERE user_id=$1', [userId]),
      pool.query('SELECT roadmap_id FROM user_saved_roadmaps WHERE user_id=$1', [userId]),
      pool.query('SELECT course_id FROM user_saved_courses WHERE user_id=$1', [userId]),
      pool.query(
        'SELECT r.id AS roadmap_id,p.topic_id FROM user_topic_progress p JOIN roadmap_topics t ON t.id=p.topic_id JOIN roadmap_stages s ON s.id=t.stage_id JOIN roadmaps r ON r.id=s.roadmap_id WHERE p.user_id=$1',
        [userId],
      ),
      pool.query(
        'SELECT resource_id,completed_at,last_position_seconds,updated_at FROM user_lesson_progress WHERE user_id=$1',
        [userId],
      ),
      pool.query(
        'SELECT action,course_id,roadmap_id,topic_id,resource_id,created_at FROM user_learning_activity WHERE user_id=$1 ORDER BY created_at DESC LIMIT 25',
        [userId],
      ),
    ]);
    const completedTopics: Record<string, string[]> = {};
    for (const row of topics.rows) (completedTopics[row.roadmap_id] ??= []).push(row.topic_id);
    res.json({
      resourceIds: bookmarks.rows.map((x) => x.resource_id),
      roadmapKeys: savedRoadmaps.rows.map((x) => x.roadmap_id),
      courseIds: savedCourses.rows.map((x) => x.course_id),
      completedTopics,
      lessons: lessons.rows,
      activity: activity.rows,
    });
  } catch {
    res.status(500).json({ error: 'Unable to load learning data' });
  }
});
router.put('/bookmarks/:id', async (req, res) => {
  const parsed = idSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid resource' });
  try {
    const result = await pool.query(
      "INSERT INTO user_bookmarks (user_id,resource_id) SELECT $1,id FROM resources WHERE id=$2 AND status='Published' ON CONFLICT DO NOTHING RETURNING resource_id",
      [res.locals.user.id, parsed.data.id],
    );
    if (!result.rows.length) {
      const found = await pool.query(
        "SELECT id FROM resources WHERE id=$1 AND status='Published'",
        [parsed.data.id],
      );
      if (!found.rows.length) return res.status(404).json({ error: 'Resource not found' });
    }
    res.json({ saved: true });
  } catch {
    res.status(500).json({ error: 'Unable to save resource' });
  }
});
router.delete('/bookmarks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM user_bookmarks WHERE user_id=$1 AND resource_id=$2', [
      res.locals.user.id,
      req.params.id,
    ]);
    res.json({ saved: false });
  } catch {
    res.status(500).json({ error: 'Unable to remove resource' });
  }
});
router.put('/roadmaps/:id', async (req, res) => {
  try {
    const result = await pool.query(
      "INSERT INTO user_saved_roadmaps (user_id,roadmap_id) SELECT $1,id FROM roadmaps WHERE id=$2 AND status='Published' ON CONFLICT DO NOTHING RETURNING roadmap_id",
      [res.locals.user.id, req.params.id],
    );
    if (!result.rows.length) {
      const exists = await pool.query(
        "SELECT id FROM roadmaps WHERE id=$1 AND status='Published'",
        [req.params.id],
      );
      if (!exists.rows.length) return res.status(404).json({ error: 'Roadmap not found' });
    }
    res.json({ saved: true });
  } catch {
    res.status(500).json({ error: 'Unable to save roadmap' });
  }
});
router.delete('/roadmaps/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM user_saved_roadmaps WHERE user_id=$1 AND roadmap_id=$2', [
      res.locals.user.id,
      req.params.id,
    ]);
    res.json({ saved: false });
  } catch {
    res.status(500).json({ error: 'Unable to remove roadmap' });
  }
});
router.put('/courses/:id', async (req, res) => {
  try {
    const result = await pool.query(
      "INSERT INTO user_saved_courses (user_id,course_id) SELECT $1,id FROM courses WHERE id=$2 AND status='Published' ON CONFLICT DO NOTHING RETURNING course_id",
      [res.locals.user.id, req.params.id],
    );
    if (!result.rows.length) {
      const found = await pool.query("SELECT id FROM courses WHERE id=$1 AND status='Published'", [
        req.params.id,
      ]);
      if (!found.rows.length) return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ saved: true });
  } catch {
    res.status(500).json({ error: 'Unable to save course' });
  }
});
router.delete('/courses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM user_saved_courses WHERE user_id=$1 AND course_id=$2', [
      res.locals.user.id,
      req.params.id,
    ]);
    res.json({ saved: false });
  } catch {
    res.status(500).json({ error: 'Unable to remove course' });
  }
});
router.put('/topics/:id', async (req, res) => {
  try {
    const result = await pool.query(
      "INSERT INTO user_topic_progress (user_id,topic_id) SELECT $1,t.id FROM roadmap_topics t JOIN roadmap_stages s ON s.id=t.stage_id JOIN roadmaps r ON r.id=s.roadmap_id WHERE t.id=$2 AND r.status='Published' ON CONFLICT DO NOTHING RETURNING topic_id",
      [res.locals.user.id, req.params.id],
    );
    if (!result.rows.length) {
      const exists = await pool.query('SELECT id FROM roadmap_topics WHERE id=$1', [req.params.id]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Topic not found' });
    }
    await pool.query(
      'INSERT INTO user_learning_activity (user_id,topic_id,action) VALUES ($1,$2,$3)',
      [res.locals.user.id, req.params.id, 'topic_completed'],
    );
    res.json({ completed: true });
  } catch {
    res.status(500).json({ error: 'Unable to update topic' });
  }
});
router.delete('/topics/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM user_topic_progress WHERE user_id=$1 AND topic_id=$2', [
      res.locals.user.id,
      req.params.id,
    ]);
    res.json({ completed: false });
  } catch {
    res.status(500).json({ error: 'Unable to update topic' });
  }
});
router.post('/sessions/:id', async (req, res) => {
  try {
    const found = await pool.query(
      "SELECT id FROM resources WHERE id=$1 AND status='Published' AND kind='Video'",
      [req.params.id],
    );
    if (!found.rows.length) return res.status(404).json({ error: 'Lesson not found' });
    await pool.query(
      'INSERT INTO user_learning_activity (user_id,resource_id,action) VALUES ($1,$2,$3)',
      [res.locals.user.id, req.params.id, 'lesson_opened'],
    );
    await pool.query(
      'INSERT INTO user_lesson_progress (user_id,resource_id) VALUES ($1,$2) ON CONFLICT (user_id,resource_id) DO UPDATE SET updated_at=NOW()',
      [res.locals.user.id, req.params.id],
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Unable to start session' });
  }
});
router.put('/lessons/:id', async (req, res) => {
  const parsed = z
    .object({
      completed: z.boolean(),
      positionSeconds: z.number().int().min(0).max(86400).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid lesson progress' });
  try {
    const found = await pool.query(
      "SELECT id FROM resources WHERE id=$1 AND status='Published' AND kind='Video'",
      [req.params.id],
    );
    if (!found.rows.length) return res.status(404).json({ error: 'Lesson not found' });
    await pool.query(
      'INSERT INTO user_lesson_progress (user_id,resource_id,completed_at,last_position_seconds) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id,resource_id) DO UPDATE SET completed_at=EXCLUDED.completed_at,last_position_seconds=COALESCE(EXCLUDED.last_position_seconds,user_lesson_progress.last_position_seconds),updated_at=NOW()',
      [
        res.locals.user.id,
        req.params.id,
        parsed.data.completed ? new Date() : null,
        parsed.data.positionSeconds || null,
      ],
    );
    if (parsed.data.completed)
      await pool.query(
        'INSERT INTO user_learning_activity (user_id,resource_id,action) VALUES ($1,$2,$3)',
        [res.locals.user.id, req.params.id, 'lesson_completed'],
      );
    res.json({ completed: parsed.data.completed });
  } catch {
    res.status(500).json({ error: 'Unable to update lesson' });
  }
});
router.patch('/lessons/:id/position', async (req, res) => {
  const parsed = z
    .object({ positionSeconds: z.number().int().min(0).max(86400) })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid position' });
  try {
    const found = await pool.query(
      "SELECT id FROM resources WHERE id=$1 AND status='Published' AND kind='Video'",
      [req.params.id],
    );
    if (!found.rows[0]) return res.status(404).json({ error: 'Lesson not found' });
    await pool.query(
      'INSERT INTO user_lesson_progress (user_id,resource_id,last_position_seconds) VALUES ($1,$2,$3) ON CONFLICT (user_id,resource_id) DO UPDATE SET last_position_seconds=EXCLUDED.last_position_seconds,updated_at=NOW()',
      [res.locals.user.id, req.params.id, parsed.data.positionSeconds],
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Unable to save playback position' });
  }
});
router.post('/import', async (req, res) => {
  const parsed = z
    .object({
      resourceIds: z.array(z.string().max(150)).max(100),
      roadmapKeys: z.array(z.string().max(150)).max(50),
      completedTopics: z.record(z.string(), z.array(z.string().max(150)).max(200)),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid learning data' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const id of parsed.data.resourceIds)
      await client.query(
        "INSERT INTO user_bookmarks (user_id,resource_id) SELECT $1,id FROM resources WHERE id=$2 AND status='Published' ON CONFLICT DO NOTHING",
        [res.locals.user.id, id],
      );
    for (const id of parsed.data.roadmapKeys)
      await client.query(
        "INSERT INTO user_saved_roadmaps (user_id,roadmap_id) SELECT $1,id FROM roadmaps WHERE id=$2 AND status='Published' ON CONFLICT DO NOTHING",
        [res.locals.user.id, id],
      );
    for (const [roadmapId, ids] of Object.entries(parsed.data.completedTopics))
      for (const id of ids)
        await client.query(
          "INSERT INTO user_topic_progress (user_id,topic_id) SELECT $1,t.id FROM roadmap_topics t JOIN roadmap_stages s ON s.id=t.stage_id JOIN roadmaps r ON r.id=s.roadmap_id WHERE t.id=$2 AND r.id=$3 AND r.status='Published' ON CONFLICT DO NOTHING",
          [res.locals.user.id, id, roadmapId],
        );
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Unable to import progress' });
  } finally {
    client.release();
  }
});
export default router;
