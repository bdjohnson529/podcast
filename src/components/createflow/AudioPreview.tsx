"use client";

import { PodcastScript, AudioGeneration } from "@/types";
import { AudioPlayer } from "@/components/AudioPlayer";

interface AudioPreviewProps {
  script: PodcastScript;
  audio: AudioGeneration;
  onStartOver: () => void;
}

export function AudioPreview({ script, audio, onStartOver }: AudioPreviewProps) {
  return (
    <div className="space-y-6">
      <AudioPlayer script={script} audio={audio} onStartOver={onStartOver} />
    </div>
  );
}

