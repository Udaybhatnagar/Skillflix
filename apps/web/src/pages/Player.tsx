import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/Auth';
import { useLearning } from '../context/LearningState';
import { useLanguage } from '../context/Language';
import { useApi } from '../hooks/useApi';
import { api, request } from '../services/api';
import { ErrorState, Loading, NotFound } from '../components/shared/States';
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
    <main className="container-site py-9">
      <Link to="/resources" className="inline-flex items-center gap-2 text-sm text-blue">
        <ArrowLeft size={16} /> Resource library
      </Link>
      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
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
          <p className="eyebrow mt-7">
            {resource.kind} · {resource.category}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{current?.title || resource.title}</h1>
          <p className="mt-4 text-muted">{current?.description || resource.description}</p>
          <p className="mt-3 text-sm text-muted">
            Curated by {resource.creator}. Playback and advertisements are controlled by YouTube.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="button-primary"
              disabled={!trackedCurrent}
              onClick={() => void complete()}
            >
              <Check size={17} />
              {completed ? t('markIncomplete') : t('markComplete')}
            </button>
            <a
              className="button-outline"
              href={current?.url || resource.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open on YouTube <ExternalLink size={16} />
            </a>
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
          <div className="mt-8 flex justify-between border-t border-border pt-5">
            <button
              className="button-outline"
              disabled={active === 0}
              onClick={() => select(active - 1)}
            >
              <ArrowLeft size={16} /> {t('previous')}
            </button>
            <button
              className="button-outline"
              disabled={active >= lessons.length - 1}
              onClick={() => select(active + 1)}
            >
              {t('next')} <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <aside className="card h-fit lg:sticky lg:top-8">
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
                    className={`w-full rounded-lg p-3 text-left text-sm ${index === active ? 'bg-softblue text-blue' : 'hover:bg-paper'}`}
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
    </main>
  );
}
