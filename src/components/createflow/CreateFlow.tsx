'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/AuthProvider';
import { CreateNew } from '@/components/createflow/CreateNew';
import { ScriptPreview } from '@/components/ScriptPreview';
import { AudioPlayer } from '@/components/AudioPlayer';
import { UploadStep } from '@/components/UploadStep';
import toast from 'react-hot-toast';

export type AppStep = 'input' | 'script' | 'audio' | 'upload';

export function CreateFlow() {
  const [currentStep, setCurrentStep] = useState<AppStep>('input');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { session } = useAuth();
  const {
    currentInput,
    currentScript,
    currentAudio,
    isGeneratingScript,
    isGeneratingAudio,
    setCurrentScript,
    setCurrentAudio,
    setIsGeneratingScript,
    setIsGeneratingAudio,
    resetCurrentSession,
  } = useAppStore();

  const handleGenerateScript = async () => {
    if (!currentInput.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGeneratingScript(true);
    setCurrentScript(null);
    setCurrentAudio(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers,
        body: JSON.stringify(currentInput),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = 'Failed to generate script';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error || errorMessage;
        } catch {
          errorMessage = errorData || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const script = await response.json();
      setCurrentScript(script);
      setCurrentStep('script');
      toast.success('Script generated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate script. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!currentScript) {
      toast.error('No script available');
      return;
    }

    setIsGeneratingAudio(true);
    setCurrentAudio(null);

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scriptId: currentScript.id,
          scriptData: currentScript,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = 'Failed to generate audio';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error || parsedError.details || errorMessage;
        } catch {
          errorMessage = errorData || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const audio = await response.json();
      setCurrentAudio(audio);
      setCurrentStep('audio');
      toast.success('Audio generated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleStartOver = () => {
    resetCurrentSession();
    setCurrentStep('input');
  };

  const handleUploadToSupabase = async () => {
    if (!currentScript || !currentAudio) {
      toast.error('No episode to upload');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const episodeId = crypto.randomUUID();

      let finalAudioUrl = currentAudio.audioUrl;

      if (currentAudio.audioUrl?.includes('supabase') && session?.access_token) {
        try {
          const copyResponse = await fetch('/api/copy-audio', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              sourceScriptId: currentScript.id,
              targetEpisodeId: episodeId,
            }),
          });

          if (copyResponse.ok) {
            const copyResult = await copyResponse.json();
            finalAudioUrl = copyResult.newAudioUrl;
          }
        } catch {
          // ignore copy error, use original URL
        }
      }

      const uploadPayload = {
        id: episodeId,
        topic: currentInput.topic,
        familiarity: currentInput.familiarity,
        duration: currentInput.duration,
        script: currentScript,
        audio_url: finalAudioUrl,
        audio_duration: currentAudio.duration,
      };

      const response = await fetch('/api/episodes', {
        method: 'POST',
        headers,
        body: JSON.stringify(uploadPayload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to upload episode to Supabase: ${response.status} ${errorData}`);
      }

      await response.json();

      setUploadStatus('success');
      setCurrentStep('upload');
      toast.success('Episode uploaded to Supabase successfully!');
    } catch (error) {
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload episode';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 ${currentStep === 'input' ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'input' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <span className="font-medium">Create New</span>
        </div>
        
        <div className="w-8 h-0.5 bg-gray-300"></div>
        
        <div className={`flex items-center space-x-2 ${currentStep === 'script' ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'script' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <span className="font-medium">Script Preview</span>
        </div>
        
        <div className="w-8 h-0.5 bg-gray-300"></div>
        
        <div className={`flex items-center space-x-2 ${currentStep === 'audio' ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'audio' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
          <span className="font-medium">Audio Preview</span>
        </div>
        
        <div className="w-8 h-0.5 bg-gray-300"></div>
        
        <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'upload' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            4
          </div>
          <span className="font-medium">Publish</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {renderStepIndicator()}

        {currentStep === 'input' && (
          <CreateNew onGenerate={handleGenerateScript} />
        )}

        {currentStep === 'script' && currentScript && (
          <ScriptPreview 
            script={currentScript}
            onGenerateAudio={handleGenerateAudio}
            onStartOver={handleStartOver}
            isGeneratingAudio={isGeneratingAudio}
          />
        )}

        {currentStep === 'audio' && currentScript && currentAudio && (
          <div className="space-y-6">
            <AudioPlayer 
              script={currentScript}
              audio={currentAudio}
              onStartOver={handleStartOver}
            />
          </div>
        )}

        {currentStep === 'upload' && currentScript && currentAudio && (
          <UploadStep
            script={currentScript}
            audio={currentAudio}
            input={currentInput}
            uploadStatus={uploadStatus}
            isUploading={isUploading}
            onUpload={handleUploadToSupabase}
            onStartOver={handleStartOver}
          />
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (currentStep === 'script') setCurrentStep('input');
              if (currentStep === 'audio') setCurrentStep('script');
              if (currentStep === 'upload') setCurrentStep('audio');
            }}
            disabled={currentStep === 'input'}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 'input'
                ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white shadow-sm'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="text-left">
              <div className="text-sm">
                {currentStep === 'script' && 'Edit Topic'}
                {currentStep === 'audio' && 'Review Script'}
                {currentStep === 'upload' && 'Back to Audio'}
              </div>
              <div className="text-xs text-gray-500">
                {currentStep === 'script' && 'Change your learning focus'}
                {currentStep === 'audio' && 'Make final adjustments'}
                {currentStep === 'upload' && 'Listen again'}
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              if (currentStep === 'input') handleGenerateScript();
              if (currentStep === 'script') handleGenerateAudio();
              if (currentStep === 'audio') setCurrentStep('upload');
            }}
            disabled={
              (currentStep === 'input' && !currentInput.topic.trim()) ||
              (currentStep === 'script' && !currentScript) ||
              (currentStep === 'audio' && !currentAudio) ||
              currentStep === 'upload' ||
              isGeneratingScript ||
              isGeneratingAudio
            }
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              (currentStep === 'input' && !currentInput.topic.trim()) ||
              (currentStep === 'script' && !currentScript) ||
              (currentStep === 'audio' && !currentAudio) ||
              currentStep === 'upload' ||
              isGeneratingScript ||
              isGeneratingAudio
                ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
            }`}
          >
            <div className="text-right">
              <div className="text-sm">
                {currentStep === 'input' && 'Generate Script'}
                {currentStep === 'script' && 'Create Audio'}
                {currentStep === 'audio' && 'Go to Upload'}
                {currentStep === 'upload' && 'Complete'}
              </div>
            </div>
            {currentStep !== 'upload' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
