import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/Auth';
import { useLearning } from '../context/LearningState';
import { useLanguage } from '../context/Language';
import { useApi } from '../hooks/useApi';
import { api, request } from '../services/api';
import { ErrorState, Loading, NotFound } from '../components/shared/States';
import { Bookmark, Layers, Sparkles } from '../design/Common';
import { LessonNotes } from '../design/LessonNotes';
interface YTPlayer {
  destroy: () => void;
  getCurrentTime: () => number;
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
  playVideoAt: (index: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
}
interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      width?: string;
      height?: string;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events: { onReady: () => void; onError: (event: { data: number }) => void };
    },
  ) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}
function YouTubePlayer({
  videoId,
  playlistId,
  onPosition,
  onPlaylist,
  controls,
}: {
  videoId: string;
  playlistId?: string | null;
  onPosition: (seconds: number) => void;
  onPlaylist: (ids: string[], index: number) => void;
  controls: React.MutableRefObject<YTPlayer | null>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onPosition, onPlaylist });
  callbacks.current = { onPosition, onPlaylist };
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let player: YTPlayer | undefined;
    let timer: number | undefined;
    const create = () => {
      if (cancelled || !host.current || !window.YT) return;
      host.current.replaceChildren();
      const mount = document.createElement('div');
      host.current.appendChild(mount);
      player = new window.YT.Player(mount, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          rel: 0,
          playsinline: 1,
          origin: location.origin,
          ...(playlistId && !videoId ? { listType: 'playlist', list: playlistId } : {}),
        },
        events: {
          onReady: () => {
            setReady(true);
            timer = window.setInterval(() => {
              if (player) callbacks.current.onPosition(Math.floor(player.getCurrentTime()));
            }, 15000);
          },
          onError: (event) =>
            setError(
              event.data === 101 || event.data === 150
                ? 'This video cannot be embedded. Open it on YouTube.'
                : 'The player could not load this video.',
            ),
        },
      });
      controls.current = player;
    };
    const playlistTimer = window.setInterval(() => {
      if (player && playlistId) {
        const ids = player.getPlaylist?.() || [];
        if (ids.length) callbacks.current.onPlaylist(ids, player.getPlaylistIndex());
      }
    }, 1000);
    setReady(false);
    setError('');
    if (window.YT?.Player) create();
    else {
      window.onYouTubeIframeAPIReady = create;
      if (!document.querySelector('script[data-youtube-api]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.dataset.youtubeApi = 'true';
        document.head.appendChild(script);
      }
    }
    return () => {
      cancelled = true;
      clearInterval(playlistTimer);
      controls.current = null;
      if (timer) clearInterval(timer);
      try {
        player?.destroy();
      } catch {
        /* YouTube may already have removed the iframe */
      }
    };
  }, [videoId, playlistId]);
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-ink text-white">
      <div ref={host} className="youtube-host h-full w-full" />
      {!ready && !error && (
        <p className="absolute inset-0 grid place-items-center text-sm">Loading player…</p>
      )}
      {error && (
        <p role="alert" className="absolute inset-0 grid place-items-center bg-ink p-6 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
export function Player() {
  const { t } = useLanguage();
  const { slug = '' } = useParams();
  const { user, loading: authLoading } = useAuth();
  const learning = useLearning();
  const result = useApi(() => api.resource(slug), [slug]);
  const [active, setActive] = useState(0);
  const [playlistVideos, setPlaylistVideos] = useState<string[]>([]);
  const controls = useRef<YTPlayer | null>(null);
  const [message, setMessage] = useState('');
  const [lessonTab, setLessonTab] = useState('Overview');
  const position = useRef(0);
  useEffect(() => {
    setActive(0);
    setPlaylistVideos([]);
  }, [slug]);
  const sessionResource =
    result.data?.kind === 'Playlist'
      ? result.data.lessons.find((x) => x.video_id === playlistVideos[active])
      : result.data;
  useEffect(() => {
    if (!user || !sessionResource?.id || sessionResource.kind !== 'Video') return;
    position.current = 0;
    void request(`/me/learning/sessions/${sessionResource.id}`, { method: 'POST' }).catch(() =>
      setMessage('Unable to record this learning session'),
    );
  }, [user?.id, sessionResource?.id]);
  if (authLoading)
    return (
      <main className="container-site">
        <Loading />
      </main>
    );
  if (!user)
    return <Navigate to={`/login?returnTo=${encodeURIComponent(`/learn/${slug}`)}`} replace />;
  if (result.loading)
    return (
      <main className="container-site">
        <Loading />
      </main>
    );
  if (result.error)
    return result.error === 'Not found' ? (
      <NotFound />
    ) : (
      <main className="container-site py-12">
        <ErrorState message={result.error} />
      </main>
    );
  const resource = result.data;
  if (!resource) return <NotFound />;
  const nativePlaylist = resource.kind === 'Playlist' && !!resource.playlist_id;
  const lessons = nativePlaylist
    ? playlistVideos.map(
        (id, index) =>
          resource.lessons.find((r) => r.video_id === id) || {
            id: `youtube:${id}`,
            video_id: id,
            title: `Lesson ${index + 1}`,
            url: `https://www.youtube.com/watch?v=${id}`,
            description: '',
            kind: 'Video' as const,
          },
      )
    : resource.kind === 'Playlist'
      ? resource.lessons
      : [resource];
  const current = lessons[active];
  const trackedCurrent = current && !current.id.startsWith('youtube:') ? current : null;
  const completed = !!learning.state.lessons.find(
    (x) => x.resource_id === current?.id && x.completed_at,
  );
  const select = (index: number) => {
    if (nativePlaylist) controls.current?.playVideoAt(index);
    setActive(index);
    setMessage('');
  };
  async function complete() {
    if (!trackedCurrent) return;
    try {
      await request(`/me/learning/lessons/${trackedCurrent.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !completed, positionSeconds: position.current }),
      });
      await learning.refresh();
      setMessage(completed ? 'Lesson marked incomplete' : 'Lesson complete');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save progress');
    }
  }
  return (
    <div className="lesson-container">
      <Link to="/resources" className="inline-flex items-center gap-2 text-sm text-blue">
        <ArrowLeft size={16} /> Resource library
      </Link>
      <div className="lesson-layout mt-7">
        <section className="lesson-main">
          <YouTubePlayer
            key={resource.id}
            videoId={nativePlaylist ? '' : current?.video_id || resource.video_id || ''}
            playlistId={resource.playlist_id}
            controls={controls}
            onPlaylist={(ids, index) => {
              setPlaylistVideos((previous) => (previous.join() === ids.join() ? previous : ids));
              setActive(index);
            }}
            onPosition={(n) => {
              position.current = n;
              if (trackedCurrent?.id)
                void request(`/me/learning/lessons/${trackedCurrent.id}/position`, {
                  method: 'PATCH',
                  body: JSON.stringify({ positionSeconds: n }),
                }).catch(() => setMessage('Playback position could not be saved'));
            }}
          />
          <div className="lesson-title-row">
            <div>
              <span className="eyebrow">
                LESSON {active + 1} / {resource.language.toUpperCase()}
              </span>
              <h2>{current?.title || resource.title}</h2>
              <p>By {resource.creator}</p>
            </div>
            <button
              className={`btn ${completed ? 'secondary' : ''}`}
              disabled={!trackedCurrent}
              onClick={() => void complete()}
            >
              {completed ? t('markIncomplete') : t('markComplete')}
              <Check className="icon" />
            </button>
          </div>
          <div className="tabs" role="tablist">
            {['Overview', 'Notes', 'Resources'].map((tab) => (
              <button
                key={tab}
                className={lessonTab === tab ? 'active' : ''}
                role="tab"
                aria-selected={lessonTab === tab}
                onClick={() => setLessonTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="lesson-panel">
            {lessonTab === 'Notes' ? (
              <LessonNotes
                key={resource.id + current?.video_id}
                resourceId={resource.id}
                videoId={current?.video_id}
              />
            ) : lessonTab === 'Overview' ? (
              <>
                <h3>Keep the bigger picture in view.</h3>
                <p>
                  {current?.description ||
                    resource.description ||
                    `This lesson is part of ${resource.title}. Learn at your pace and mark it complete when you are ready.`}
                </p>
                <div className="learning-callout">
                  <span>
                    <Sparkles className="icon" />
                  </span>
                  <div>
                    <h4>A small practice prompt</h4>
                    <p>
                      Write down one key idea, one question, and one way you could use this in your
                      own project.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3>Your supporting resources.</h3>
                <button
                  className="resource-link"
                  onClick={() => learning.toggleResource(resource.id)}
                >
                  <Bookmark className="icon" />
                  {learning.isResourceSaved(resource.id) ? 'Remove bookmark' : 'Save this resource'}
                </button>
                {resource.related_slug && (
                  <Link className="resource-link" to={`/paths?goal=${resource.related_slug}`}>
                    <Layers className="icon" />
                    Explore the learning paths
                  </Link>
                )}
                <a
                  className="resource-link"
                  href={current?.url || resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Original YouTube source
                  <ExternalLink className="icon" />
                </a>
              </>
            )}
          </div>
          {current && !trackedCurrent && (
            <p className="mt-4 text-xs text-muted">
              This lesson is streamed from the YouTube playlist. Completion tracking is available
              when an administrator adds it to the curated lesson library.
            </p>
          )}
          {message && (
            <p role="status" className="mt-4 text-sm text-blue">
              {message}
            </p>
          )}
          <div className="lesson-pagination">
            <button
              className="btn secondary"
              disabled={active === 0}
              onClick={() => select(active - 1)}
            >
              <ArrowLeft size={16} /> {t('previous')}
            </button>
            <button
              className="btn secondary"
              disabled={active >= lessons.length - 1}
              onClick={() => select(active + 1)}
            >
              {t('next')} <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <aside className="lesson-sidebar">
          <div className="sidebar-heading">
            <span className="eyebrow">YOUR LEARNING PATH</span>
            <h3>{resource.title}</h3>
            <div className="progressbar">
              <i
                style={{
                  width: `${lessons.length ? Math.round((lessons.filter((l) => learning.state.lessons.some((p) => p.resource_id === l.id && p.completed_at)).length / lessons.length) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
          <h2 className="text-2xl">
            {resource.kind === 'Playlist' ? t('playlistLessons') : t('yourLesson')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            {nativePlaylist ? ' in this playlist' : ''}
          </p>
          {lessons.length ? (
            <ol className="mt-5 space-y-2">
              {lessons.map((lesson, index) => (
                <li key={lesson.id}>
                  <button
                    className={index === active ? 'current' : ''}
                    onClick={() => select(index)}
                  >
                    <span className="mr-2 font-semibold">{index + 1}.</span>
                    {lesson.title}
                    {learning.state.lessons.some(
                      (x) => x.resource_id === lesson.id && x.completed_at,
                    ) && <Check size={15} className="ml-2 inline" />}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-sm text-muted">
              {nativePlaylist
                ? 'Loading playlist lessons from YouTube. You can also use the playlist controls inside the player.'
                : 'No curated lessons have been added yet.'}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
