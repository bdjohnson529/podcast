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
    <div className="mt-6 max-w-2xl mx-auto">
      <div className="bg-purple-100/90 backdrop-blur rounded-xl border border-purple-300 shadow-sm p-4">
        {/* Title and selector */}
        <div className="flex items-center justify-center mb-2">
          <p className="text-s text-gray-500 text-center font-bold">{selected?.script?.title || 'Public episode'}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            aria-label="Previous"
            onClick={skipPrev}
            className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <BackwardIcon className="h-5 w-5" />
          </button>
          <button
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            className="p-3 rounded-full bg-gray-900 text-white hover:bg-gray-800 shadow"
          >
            {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
          </button>
          <button
            aria-label="Next"
            onClick={() => skipNext(false)}
            className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ForwardIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center text-[11px] text-gray-500">
            <span className="tabular-nums">{fmt(currentTime)}</span>
            <div
              ref={progressRef}
              onClick={onBarClick}
              className="mx-3 flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer relative"
            >
              <div
                className="absolute left-0 top-0 h-full bg-primary-600 rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute -top-1.5 h-4 w-4 rounded-full bg-white border border-gray-300 shadow"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>
            <span className="tabular-nums">{fmt(duration)}</span>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} preload="metadata" />
      </div>
    </div>
  );
}
