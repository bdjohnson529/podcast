'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PlayIcon, PauseIcon, BackwardIcon, ForwardIcon } from '@heroicons/react/24/outline';

type PublicEpisode = { id: string; audio_url?: string; script?: { title?: string } };

/**
 * Spotify-like minimal public samples player for all visitors.
 * Custom controls: prev/play-next and a progress bar with time.
 */
export default function PublicSamples() {
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState<PublicEpisode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  // Fetch public episodes
  useEffect(() => {
    const fetchPublic = async () => {
      try {
        setLoading(true);
        const filters = encodeURIComponent(JSON.stringify({ status: 'ready' }));
        const res = await fetch(`/api/episodes?scope=public&filters=${filters}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const withAudio = (data.episodes || []).filter((e: any) => !!e.audio_url);
        const top: PublicEpisode[] = withAudio.slice(0, 5);
        setEpisodes(top);
        if (top.length) setSelectedId(top[0].id);
      } catch (err) {
        console.error('Failed to load public samples', err);
        setEpisodes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPublic();
  }, []);

  const selected = useMemo(
    () => episodes.find(e => e.id === selectedId) || episodes[0],
    [episodes, selectedId]
  );

  // Reset/attach audio when selection changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    setCurrentTime(0);
    setDuration(0);
    audio.src = selected.audio_url || '';
    audio.load();
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => {
      // Auto play next track using current playlist state
      if (!episodes.length) return;
      const idx = Math.max(0, episodes.findIndex(e => e.id === selected.id));
      const nextIdx = (idx + 1) % episodes.length;
      const nextId = episodes[nextIdx]?.id;
      if (nextId) {
        setSelectedId(nextId);
        setTimeout(() => audioRef.current?.play().catch(() => {}), 0);
      }
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [selected, isPlaying, episodes]);

  // Play/pause toggle
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn('Playback failed', e);
      }
    }
  };

  const fmt = (t: number) => {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const seekAtClientX = (clientX: number) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(audio.currentTime);
  };

  const onBarClick = (e: React.MouseEvent) => {
    seekAtClientX(e.clientX);
  };

  const currentIndex = useMemo(() =>
    Math.max(0, episodes.findIndex(e => e.id === selected?.id)), [episodes, selected?.id]);

  const skipPrev = () => {
    if (!episodes.length) return;
    const idx = (currentIndex - 1 + episodes.length) % episodes.length;
    setSelectedId(episodes[idx].id);
  };

  const skipNext = (auto = false) => {
    if (!episodes.length) return;
    const idx = (currentIndex + 1) % episodes.length;
    setSelectedId(episodes[idx].id);
    if (auto) setTimeout(() => audioRef.current?.play().catch(() => {}), 0);
  };

  if (loading) {
    return (
      <div className="mt-6 flex justify-center">
        <div className="flex items-center space-x-2 text-gray-500 text-sm">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
          <span>Loading sample…</span>
        </div>
      </div>
    );
  }

  if (!episodes.length || !selected?.audio_url) return null;

  return (
    <div className="mt-8 max-w-2xl mx-auto">
      <div className="rounded-2xl border border-white/50 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6">
        {/* Title */}
        <div className="flex items-center justify-center mb-4">
          <p className="text-sm text-ink font-semibold text-center">{selected?.script?.title || 'Public episode'}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            aria-label="Previous track"
            onClick={skipPrev}
            className="p-2 min-w-[40px] min-h-[40px] text-ink/70 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40 rounded-full"
          >
            <BackwardIcon className="h-5 w-5" />
          </button>
          <button
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            className="p-3 min-w-[52px] min-h-[52px] rounded-full bg-gradient-to-r from-primary to-accent text-white hover:scale-[1.03] active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 shadow-lg shadow-primary/20"
          >
            {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
          </button>
          <button
            aria-label="Next track"
            onClick={() => skipNext(false)}
            className="p-2 min-w-[40px] min-h-[40px] text-ink/70 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40 rounded-full"
          >
            <ForwardIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center text-xs text-ink-2">
            <span className="tabular-nums w-10 text-left">{fmt(currentTime)}</span>
            <div
              ref={progressRef}
              onClick={onBarClick}
              className="mx-3 flex-1 h-2 bg-ink/10 rounded-full cursor-pointer relative focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              aria-label="Seek audio position"
              tabIndex={0}
            >
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-accent rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute -top-1 h-4 w-4 rounded-full bg-white border-2 border-primary shadow-sm"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>
            <span className="tabular-nums w-10 text-right">{fmt(duration)}</span>
          </div>
        </div>

        {/* Episode selector */}
        {episodes.length > 1 && (
          <div className="mt-3 flex justify-center">
            <select
              id="sample-select"
              className="text-xs bg-white/50 border border-ink/10 rounded-lg px-3 py-1.5 text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
              value={selected?.id}
              onChange={(e) => setSelectedId(e.target.value)}
              aria-label="Choose episode"
            >
              {episodes.map((ep, idx) => (
                <option key={ep.id} value={ep.id}>
                  {ep.script?.title || `Episode ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Hidden audio element */}
        <audio ref={audioRef} preload="metadata" aria-live="polite" />
      </div>
    </div>
  );
}
