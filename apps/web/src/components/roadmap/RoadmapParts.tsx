import { ArrowRight, Bookmark, Check, ChevronDown, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Resource } from '../../types';
import type { Roadmap, RoadmapStage as Stage, RoadmapTopic } from '../../types/roadmap';
import { roadmapHours } from '../../data/roadmaps';
import { useLearning } from '../../context/LearningState';
import { useLanguage } from '../../context/Language';
import { roadmapProgress } from '../../utils/roadmapProgress';

export function RoadmapHeader({ roadmap }: { roadmap: Roadmap }) {
  const { t } = useLanguage();
  const { isRoadmapSaved, toggleRoadmap } = useLearning();
  const key = roadmap.id || `${roadmap.type}:${roadmap.slug}`;
  const saved = isRoadmapSaved(key);
  return (
    <header className="grid gap-8 border-b border-border pb-10 md:grid-cols-[1fr_auto]">
      <div>
        <p className="eyebrow">
          {roadmap.type === 'exam' ? 'Exam preparation' : 'Professional skill'} / Learning roadmap
        </p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{roadmap.title}</h1>
        <p className="mt-5 max-w-3xl leading-7 text-muted">{roadmap.overview}</p>
        <p className="mt-5 flex items-center gap-2 text-sm text-blue">
          <Clock3 size={17} /> About {roadmapHours(roadmap)} study hours · {roadmap.stages.length}{' '}
          stages
        </p>
      </div>
      <button
        type="button"
        className="button-outline h-fit"
        aria-pressed={saved}
        onClick={() => toggleRoadmap(key)}
      >
        <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
        {saved ? t('savedRoadmap') : t('saveRoadmap')}
      </button>
    </header>
  );
}
export function RoadmapProgress({ roadmap }: { roadmap: Roadmap }) {
  const { state } = useLearning();
  const key = roadmap.id || `${roadmap.type}:${roadmap.slug}`;
  const { count, total, percent } = roadmapProgress(roadmap, state.completedTopics[key] || []);
  return (
    <section
      aria-label="Roadmap progress"
      className="rounded-2xl border border-border bg-white p-6"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your progress</p>
          <p className="mt-2 text-3xl font-semibold text-blue">{percent}%</p>
        </div>
        <p className="text-sm text-muted">
          {count} of {total} topics complete
        </p>
      </div>
      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-softblue"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Roadmap completion"
      >
        <div
          className="h-full rounded-full bg-blue transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-4 text-xs text-muted">Progress is saved to your account.</p>
    </section>
  );
}
export function PrerequisiteLabel({ names }: { names: string[] }) {
  return names.length ? (
    <p className="mt-2 text-xs text-muted">
      <strong>Before this:</strong> {names.join(', ')}
    </p>
  ) : null;
}
export function PlaylistCard({ resource }: { resource: Resource }) {
  return (
    <Link
      to={`/learn/${resource.slug}`}
      className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-paper px-4 py-3 text-sm text-blue hover:border-blue"
    >
      <span>
        {resource.kind}: {resource.title}
      </span>
      <ArrowRight size={15} className="shrink-0" />
    </Link>
  );
}
export function TopicRow({
  topic,
  roadmapKey,
  resources,
}: {
  topic: RoadmapTopic;
  roadmapKey: string;
  resources: Resource[];
}) {
  const { isTopicComplete, toggleTopic } = useLearning();
  const checked = isTopicComplete(roadmapKey, topic.id);
  return (
    <li className="border-t border-border py-5">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-blue"
          checked={checked}
          onChange={() => toggleTopic(roadmapKey, topic.id)}
          aria-label={`Mark ${topic.title} ${checked ? 'incomplete' : 'complete'}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className={`font-semibold ${checked ? 'text-muted line-through' : 'text-ink'}`}>
              {topic.title}
            </h4>
            <span className="text-xs text-muted">{topic.hours} hours</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{topic.description}</p>
          <PrerequisiteLabel names={topic.prerequisites} />
          {topic.resourceIds.map((id) => {
            const resource = resources.find((r) => r.id === id);
            return resource ? <PlaylistCard key={id} resource={resource} /> : null;
          })}
        </div>
        {checked && <Check className="text-blue" size={18} />}
      </div>
    </li>
  );
}
export function RoadmapStage({
  stage,
  index,
  roadmapKey,
  resources,
  open,
  onToggle,
}: {
  stage: Stage;
  index: number;
  roadmapKey: string;
  resources: Resource[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white">
      <button
        className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`stage-${stage.id}`}
      >
        <span className="font-serif text-3xl text-blue">{String(index + 1).padStart(2, '0')}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-2xl">{stage.title}</span>
          <span className="mt-1 block text-sm text-muted">{stage.description}</span>
        </span>
        <ChevronDown
          size={19}
          className={`shrink-0 text-blue transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ol id={`stage-${stage.id}`} className="px-5 pb-2 sm:px-6">
          {stage.topics.map((topic) => (
            <TopicRow key={topic.id} topic={topic} roadmapKey={roadmapKey} resources={resources} />
          ))}
        </ol>
      )}
    </section>
  );
}
export function NextTopicCard({ roadmap }: { roadmap: Roadmap }) {
  const { state } = useLearning();
  const key = roadmap.id || `${roadmap.type}:${roadmap.slug}`;
  const { next } = roadmapProgress(roadmap, state.completedTopics[key] || []);
  return (
    <aside className="rounded-2xl bg-blue p-6 text-white">
      <p className="text-xs font-bold uppercase tracking-widest text-softblue">
        {next ? 'Up next' : 'All topics complete'}
      </p>
      <h2 className="mt-4 text-3xl">{next ? next.title : 'You finished this path.'}</h2>
      <p className="mt-3 text-sm leading-6 text-softblue">
        {next ? next.description : 'Review any topic whenever you need a refresher.'}
      </p>
      {next ? (
        <p className="mt-5 text-sm text-white">
          Estimated {next.hours} hours <ArrowRight size={15} className="ml-1 inline" />
        </p>
      ) : (
        <Link to="/my-learning" className="mt-5 inline-flex text-sm font-semibold underline">
          View My Learning
        </Link>
      )}
    </aside>
  );
}
