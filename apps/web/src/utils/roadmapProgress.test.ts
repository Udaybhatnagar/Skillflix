import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRoadmap, roadmapTopics } from '../data/roadmaps';
import { roadmapProgress } from './roadmapProgress';
test('roadmap progress uses known topics and recommends the next incomplete topic', () => {
  const roadmap = getRoadmap('exam', 'ssc-cgl');
  assert.ok(roadmap);
  const initial = roadmapProgress(roadmap, []);
  assert.equal(initial.percent, 0);
  assert.equal(initial.next?.id, 'number-basics');
  const after = roadmapProgress(roadmap, ['number-basics', 'unknown', 'number-basics']);
  assert.equal(after.count, 1);
  assert.equal(after.percent, 10);
  assert.equal(after.next?.id, 'quant-practice');
  const finished = roadmapProgress(
    roadmap,
    roadmapTopics(roadmap).map((t) => t.id),
  );
  assert.equal(finished.percent, 100);
  assert.equal(finished.next, null);
});
test('all shipped roadmaps have unique topic IDs and ordered stages', () => {
  for (const type of ['exam', 'skill'] as const) {
    for (const slug of type === 'exam' ? ['ssc-cgl', 'ibps-po'] : ['ui-ux-design']) {
      const roadmap = getRoadmap(type, slug);
      assert.ok(roadmap);
      assert.ok(roadmap.stages.length >= 5);
      const ids = roadmapTopics(roadmap).map((t) => t.id);
      assert.equal(new Set(ids).size, ids.length);
      assert.ok(ids.length >= 10);
    }
  }
});
