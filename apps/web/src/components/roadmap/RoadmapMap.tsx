import { useState, useRef, useEffect } from 'react';
import { Check, ArrowRight, BookOpen, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Roadmap, RoadmapTopic } from '../../types/roadmap';
import type { Resource } from '../../types';
import { useLearning } from '../../context/LearningState';
export function RoadmapMap({ roadmap, resources }: { roadmap: Roadmap; resources: Resource[] }) {
  const [selected, setSelected] = useState<RoadmapTopic | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selected]);
  const { isTopicComplete, toggleTopic } = useLearning();
  const key = roadmap.id || `${roadmap.type}:${roadmap.slug}`;
  return (
    <div className="roadmap-workspace">
      <div className="map-toolbar">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue" /> YOUR LEARNING MAP
        </span>
        <span>Click a topic to explore</span>
      </div>
      <div className="map-legend">
        <span>
          <i className="bg-amber-200" /> Learning stage
        </span>
        <span>
          <i className="bg-white" /> Topic
        </span>
        <span>
          <i className="bg-emerald-200" /> Completed
        </span>
      </div>
      <div className="learning-map">
        <div className="map-start">YOUR JOURNEY STARTS HERE</div>
        {roadmap.stages.map((stage, index) => (
          <section
            key={stage.id}
            className={`map-stage ${index % 2 ? 'map-stage-reverse' : ''}`}
            aria-label={`Stage ${index + 1}: ${stage.title}`}
          >
            <div className="map-stage-heading">
              <span className="map-stage-number">{String(index + 1).padStart(2, '0')}</span>
              <h2>{stage.title}</h2>
              <p>{stage.description}</p>
            </div>
            <div className="map-topics">
              {stage.topics.map((topic) => {
                const done = isTopicComplete(key, topic.id);
                return (
                  <button
                    key={topic.id}
                    className={`map-topic ${done ? 'map-topic-done' : ''}`}
                    onClick={() => setSelected(topic)}
                    aria-label={`${topic.title}${done ? ', completed' : ''}`}
                  >
                    <span className="map-topic-icon">
                      {done ? <Check size={15} /> : <BookOpen size={15} />}
                    </span>
                    <span>
                      {topic.title}
                      <small>{topic.hours} study hours</small>
                    </span>
                    <ArrowRight size={14} />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        <div className="map-finish">
          <Check size={19} /> Build. Practice. Keep growing.
        </div>
      </div>
      {selected && (
        <div
          ref={detailRef}
          className="topic-detail card"
          role="region"
          aria-label="Selected topic"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Explore topic · {selected.hours} hours</p>
              <h2 className="mt-3 text-3xl">{selected.title}</h2>
            </div>
            <button
              aria-label="Close topic details"
              className="rounded-lg p-2 hover:bg-paper"
              onClick={() => setSelected(null)}
            >
              <X size={20} />
            </button>
          </div>
          <p className="mt-4 leading-7 text-muted">{selected.description}</p>
          {selected.prerequisites.length > 0 && (
            <p className="mt-3 text-sm text-muted">
              Before you begin: {selected.prerequisites.join(', ')}
            </p>
          )}
          <div className="mt-5 space-y-2">
            {selected.resourceIds.map((id) => {
              const resource = resources.find((r) => r.id === id);
              return resource ? (
                <Link
                  key={id}
                  to={`/learn/${resource.slug}`}
                  className="flex items-center justify-between rounded-xl bg-softblue p-4 text-sm font-semibold text-blue"
                >
                  {resource.title}
                  <ArrowRight size={16} />
                </Link>
              ) : null;
            })}
            {!selected.resourceIds.some((id) => resources.some((r) => r.id === id)) && (
              <p className="rounded-xl bg-paper p-4 text-sm text-muted">
                Curated resources have not been added for this topic yet.
              </p>
            )}
          </div>
          <button className="button-primary mt-6" onClick={() => toggleTopic(key, selected.id)}>
            <Check size={17} />
            {isTopicComplete(key, selected.id) ? 'Mark incomplete' : 'Mark topic complete'}
          </button>
        </div>
      )}
    </div>
  );
}
