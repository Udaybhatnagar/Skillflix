import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAdmin, requireUser } from '../auth/session.js';
const router = Router();
router.use(requireUser, requireAdmin);
const status = z.enum(['Draft', 'Published', 'Archived']);
const header = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(180),
  overview: z.string().trim().min(10).max(5000),
  status,
});
const topic = z.object({
  id: z.string().min(1).max(150),
  title: z.string().trim().min(2).max(180),
  description: z.string().max(3000),
  hours: z.number().min(0).max(999),
  prerequisites: z.array(z.string().max(180)).max(30),
  resourceIds: z.array(z.string().max(150)).max(30),
});
const structure = z.object({
  stages: z
    .array(
      z.object({
        id: z.string().min(1).max(150),
        title: z.string().trim().min(2).max(180),
        description: z.string().max(1000),
        topics: z.array(topic).max(100),
      }),
    )
    .max(40),
});
router.get('/', async (_req, res) => {
  try {
    res.json(
      (
        await pool.query(
          'SELECT r.*,c.title AS course_title,c.kind,c.slug FROM roadmaps r JOIN courses c ON c.id=r.course_id ORDER BY r.updated_at DESC',
        )
      ).rows,
    );
  } catch {
    res.status(500).json({ error: 'Unable to load roadmaps' });
  }
});
router.post('/', async (req, res) => {
  const parsed = header.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  try {
    const h = parsed.data;
    if (h.status === 'Published')
      return res.status(400).json({ error: 'Add stages before publishing' });
    const result = await pool.query(
      'INSERT INTO roadmaps (id,course_id,title,overview,status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [randomUUID(), h.courseId, h.title, h.overview, h.status],
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(400).json({ error: 'Unable to create roadmap' });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const found = await pool.query(
      'SELECT r.*,c.title AS course_title,c.kind AS type,c.slug FROM roadmaps r JOIN courses c ON c.id=r.course_id WHERE r.id=$1',
      [req.params.id],
    );
    if (!found.rows[0]) return res.status(404).json({ error: 'Not found' });
    const [stages, topics, resources] = await Promise.all([
      pool.query(
        'SELECT id,title,description,position FROM roadmap_stages WHERE roadmap_id=$1 ORDER BY position',
        [req.params.id],
      ),
      pool.query(
        'SELECT t.* FROM roadmap_topics t JOIN roadmap_stages s ON s.id=t.stage_id WHERE s.roadmap_id=$1 ORDER BY s.position,t.position',
        [req.params.id],
      ),
      pool.query(
        'SELECT tr.topic_id,tr.resource_id FROM topic_resources tr JOIN roadmap_topics t ON t.id=tr.topic_id JOIN roadmap_stages s ON s.id=t.stage_id WHERE s.roadmap_id=$1',
        [req.params.id],
      ),
    ]);
    res.json({
      ...found.rows[0],
      stages: stages.rows.map((stage) => ({
        ...stage,
        topics: topics.rows
          .filter((t) => t.stage_id === stage.id)
          .map((t) => ({
            ...t,
            hours: Number(t.hours),
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
router.put('/:id', async (req, res) => {
  const parsed = header.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  try {
    const h = parsed.data;
    if (h.status === 'Published') {
      const count = await pool.query(
        'SELECT COUNT(*) FROM roadmap_topics t JOIN roadmap_stages s ON s.id=t.stage_id WHERE s.roadmap_id=$1',
        [req.params.id],
      );
      if (Number(count.rows[0].count) === 0)
        return res.status(400).json({ error: 'Add at least one topic before publishing' });
    }
    const result = await pool.query(
      'UPDATE roadmaps SET course_id=$2,title=$3,overview=$4,status=$5,updated_at=NOW() WHERE id=$1 RETURNING *',
      [req.params.id, h.courseId, h.title, h.overview, h.status],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(400).json({ error: 'Unable to update roadmap' });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE roadmaps SET status='Archived',updated_at=NOW() WHERE id=$1 RETURNING id,status",
      [req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Unable to archive roadmap' });
  }
});
router.put('/:id/structure', async (req, res) => {
  const parsed = structure.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const stages = parsed.data.stages;
  const stageIds = stages.map((x) => x.id);
  const topics = stages.flatMap((x) => x.topics);
  const topicIds = topics.map((x) => x.id);
  if (new Set(stageIds).size !== stageIds.length || new Set(topicIds).size !== topicIds.length)
    return res.status(400).json({ error: 'Duplicate stage or topic ID' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const exists = await client.query('SELECT id FROM roadmaps WHERE id=$1 FOR UPDATE', [
      req.params.id,
    ]);
    if (!exists.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    const old = await client.query(
      'SELECT t.id FROM roadmap_topics t JOIN roadmap_stages s ON s.id=t.stage_id WHERE s.roadmap_id=$1',
      [req.params.id],
    );
    const removed = old.rows.map((x) => x.id).filter((id) => !topicIds.includes(id));
    if (removed.length) {
      const progress = await client.query(
        'SELECT COUNT(*) FROM user_topic_progress WHERE topic_id=ANY($1)',
        [removed],
      );
      if (Number(progress.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res
          .status(409)
          .json({ error: 'A removed topic has learner progress. Keep it in the roadmap.' });
      }
    }
    await client.query('UPDATE roadmap_stages SET position=position+10000 WHERE roadmap_id=$1', [
      req.params.id,
    ]);
    await client.query(
      'UPDATE roadmap_topics SET position=position+10000 WHERE stage_id IN (SELECT id FROM roadmap_stages WHERE roadmap_id=$1)',
      [req.params.id],
    );
    for (const [stageIndex, stage] of stages.entries()) {
      await client.query(
        'INSERT INTO roadmap_stages (id,roadmap_id,title,description,position) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,position=EXCLUDED.position',
        [stage.id, req.params.id, stage.title, stage.description, stageIndex],
      );
      for (const [topicIndex, t] of stage.topics.entries()) {
        await client.query(
          'INSERT INTO roadmap_topics (id,stage_id,title,description,hours,prerequisites,position) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET stage_id=EXCLUDED.stage_id,title=EXCLUDED.title,description=EXCLUDED.description,hours=EXCLUDED.hours,prerequisites=EXCLUDED.prerequisites,position=EXCLUDED.position',
          [t.id, stage.id, t.title, t.description, t.hours, t.prerequisites, topicIndex],
        );
        await client.query('DELETE FROM topic_resources WHERE topic_id=$1', [t.id]);
        for (const resourceId of t.resourceIds)
          await client.query('INSERT INTO topic_resources (topic_id,resource_id) VALUES ($1,$2)', [
            t.id,
            resourceId,
          ]);
      }
    }
    if (removed.length)
      await client.query('DELETE FROM roadmap_topics WHERE id=ANY($1)', [removed]);
    const removedStages = await client.query(
      'SELECT id FROM roadmap_stages WHERE roadmap_id=$1 AND NOT (id=ANY($2))',
      [req.params.id, stageIds],
    );
    if (removedStages.rows.length)
      await client.query('DELETE FROM roadmap_stages WHERE id=ANY($1)', [
        removedStages.rows.map((x) => x.id),
      ]);
    await client.query('UPDATE roadmaps SET updated_at=NOW() WHERE id=$1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch {
    await client.query('ROLLBACK');
    res
      .status(400)
      .json({ error: 'Unable to save roadmap structure. Check IDs and resource associations.' });
  } finally {
    client.release();
  }
});
export default router;
