'use client';

import { useState, useRef, useEffect } from 'react';
import { PodcastScript, AudioGeneration } from '@/types';
import { useAppStore } from '@/lib/store';
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';

interface AudioPlayerProps {
  script: PodcastScript;
  audio: AudioGeneration;
  onStartOver: () => void;
}

export function AudioPlayer({ script, audio, onStartOver }: AudioPlayerProps) {
  const { audioPlaybackSpeed, setAudioPlaybackSpeed } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const updateTime = () => setCurrentTime(audioElement.currentTime);
    const updateDuration = () => setDuration(audioElement.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audioElement.addEventListener('timeupdate', updateTime);
    audioElement.addEventListener('loadedmetadata', updateDuration);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('timeupdate', updateTime);
      audioElement.removeEventListener('loadedmetadata', updateDuration);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = audioPlaybackSpeed;
    }
  }, [audioPlaybackSpeed]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownloadAudio = () => {
    if (audio.audioUrl) {
      const link = document.createElement('a');
      link.href = audio.audioUrl;
      link.download = `${script.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadTranscript = () => {
    const transcript = script.transcript
      .map(line => `${line.speaker}: ${line.text}`)
      .join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${script.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{script.title}</h2>
            <p className="text-gray-600 mt-1">Ready to listen!</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onStartOver}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Start Over</span>
            </button>
          </div>
        </div>

        {/* Audio Player */}
        <div className="bg-gray-50 rounded-lg p-6">
          <audio
            ref={audioRef}
            src={audio.audioUrl}
            preload="metadata"
            className="hidden"
          />

          {/* Main Controls */}
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6 ml-0.5" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Speed Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SpeakerWaveIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Speed:</span>
              <div className="flex space-x-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setAudioPlaybackSpeed(speed)}
                    className={`px-2 py-1 text-xs rounded ${
                      audioPlaybackSpeed === speed
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleDownloadTranscript}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Transcript</span>
              </button>
              <button
                onClick={handleDownloadAudio}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Audio (MP3)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Full Transcript
        </h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {script.transcript.map((line, index) => (
            <div key={index} className="flex space-x-4">
              <div className={`flex-shrink-0 w-16 text-xs font-medium ${
                line.speaker === 'CHRIS' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-pink-600 bg-pink-50'
              } px-2 py-1 rounded text-center`}>
                {line.speaker}
              </div>
              <div className="flex-1 text-gray-700">
                {line.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Episode Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {Math.round(duration / 60) || script.estimatedDuration}
          </div>
          <div className="text-sm text-gray-600">Minutes</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {script.transcript?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Dialogue Segments</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {script.monetizationModels?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Monetization Models</div>
        </div>
      </div>
    </div>
  );
}
