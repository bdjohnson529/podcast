'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { TopicInput } from '@/components/TopicInput';
import { ScriptPreview } from '@/components/ScriptPreview';
import { AudioPlayer } from '@/components/AudioPlayer';
import { SavedEpisodes } from '@/components/SavedEpisodes';
import { LoadingState } from '@/components/LoadingState';
import toast from 'react-hot-toast';

type AppStep = 'input' | 'script' | 'audio';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<AppStep>('input');
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

    console.log('🚀 Starting script generation process');
    console.log('📝 Input data:', currentInput);

    setIsGeneratingScript(true);
    setCurrentScript(null);
    setCurrentAudio(null);

    try {
      console.log('🌐 Making API request to /api/generate-script');
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInput),
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API error response:', errorData);
        
        let errorMessage = 'Failed to generate script';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error || errorMessage;
        } catch {
          // If it's not JSON, use the raw text
          errorMessage = errorData || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      console.log('📄 Parsing response JSON...');
      const script = await response.json();
      console.log('✅ Script received:', {
        id: script.id,
        title: script.title,
        estimatedDuration: script.estimatedDuration
      });

      setCurrentScript(script);
      setCurrentStep('script');
      toast.success('Script generated successfully!');
      console.log('🎉 Script generation completed successfully');
    } catch (error) {
      console.error('💥 Script generation error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        error: error
      });
      
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
        body: JSON.stringify({ scriptId: currentScript.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audio = await response.json();
      setCurrentAudio(audio);
      setCurrentStep('audio');
      toast.success('Audio generated successfully!');
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio. Please try again.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleStartOver = () => {
    resetCurrentSession();
    setCurrentStep('input');
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
          <span className="font-medium">Topic & Details</span>
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
          <span className="font-medium">Listen & Download</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {renderStepIndicator()}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {currentStep === 'input' && (
            <div className="space-y-6">
              <TopicInput onGenerate={handleGenerateScript} />
              {isGeneratingScript && (
                <LoadingState 
                  message="Generating your podcast script..." 
                  subMessage="This may take 30-60 seconds"
                />
              )}
            </div>
          )}

          {currentStep === 'script' && currentScript && (
            <div className="space-y-6">
              <ScriptPreview 
                script={currentScript}
                onGenerateAudio={handleGenerateAudio}
                onStartOver={handleStartOver}
              />
              {isGeneratingAudio && (
                <LoadingState 
                  message="Generating podcast audio..." 
                  subMessage="Converting script to speech with ElevenLabs"
                />
              )}
            </div>
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
        </div>

        <div className="lg:col-span-1">
          <SavedEpisodes />
        </div>
      </div>
    </div>
  );
}
