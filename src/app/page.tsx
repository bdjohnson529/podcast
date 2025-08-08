'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/AuthProvider';
import { TopicInput } from '@/components/TopicInput';
import { ScriptPreview } from '@/components/ScriptPreview';
import { AudioPlayer } from '@/components/AudioPlayer';
import { UploadStep } from '@/components/UploadStep';
import { SavedEpisodes } from '@/components/SavedEpisodes';
import { LoadingState } from '@/components/LoadingState';
import { AuthBanner } from '@/components/AuthBanner';
import toast from 'react-hot-toast';

type AppStep = 'input' | 'script' | 'audio' | 'upload';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<AppStep>('input');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { session, user, loading } = useAuth();
  const router = useRouter();
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

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

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
      
      // Prepare headers with auth token if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('🔐 Including auth token in request');
      } else {
        console.log('👤 Making request as anonymous user');
      }
      
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers,
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

    console.log('🎵 Starting audio generation process');
    console.log('📝 Script data:', {
      id: currentScript.id,
      title: currentScript.title,
      hasTranscript: !!currentScript.transcript,
      transcriptLength: currentScript.transcript?.length
    });

    setIsGeneratingAudio(true);
    setCurrentAudio(null);

    try {
      console.log('🌐 Making API request to /api/generate-audio');
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scriptId: currentScript.id,
          scriptData: currentScript // Include full script data as fallback
        }),
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API error response:', errorData);
        
        let errorMessage = 'Failed to generate audio';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error || parsedError.details || errorMessage;
        } catch {
          // If it's not JSON, use the raw text
          errorMessage = errorData || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      console.log('📄 Parsing response JSON...');
      const audio = await response.json();
      console.log('✅ Audio received:', {
        id: audio.id,
        status: audio.status,
        duration: audio.duration
      });

      setCurrentAudio(audio);
      setCurrentStep('audio');
      toast.success('Audio generated successfully!');
      console.log('🎉 Audio generation completed successfully');
    } catch (error) {
      console.error('💥 Audio generation error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        error: error
      });
      
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

    console.log('☁️ Starting upload to Supabase...');
    console.log('📊 Upload data:', {
      script: { id: currentScript.id, title: currentScript.title },
      audio: { audioUrl: currentAudio.audioUrl, duration: currentAudio.duration },
      input: currentInput
    });
    
    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      // Prepare headers with auth token if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('🔐 Including auth token for upload');
      } else {
        console.log('👤 Uploading as anonymous user');
      }

      // Generate a proper UUID for the episode
      const episodeId = crypto.randomUUID();
      console.log('🆔 Generated episode ID:', episodeId);

      // Prepare the initial upload payload
      let finalAudioUrl = currentAudio.audioUrl;

      // If audio is stored in Supabase, we need to copy it to the new episode ID
      if (currentAudio.audioUrl?.includes('supabase') && session?.access_token) {
        console.log('📁 Audio is in Supabase storage, copying to new episode ID...');
        
        try {
          // Call our API to copy the audio file
          const copyResponse = await fetch('/api/copy-audio', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              sourceScriptId: currentScript.id,
              targetEpisodeId: episodeId
            }),
          });

          if (copyResponse.ok) {
            const copyResult = await copyResponse.json();
            finalAudioUrl = copyResult.newAudioUrl;
            console.log('✅ Audio copied successfully:', finalAudioUrl);
          } else {
            console.warn('⚠️ Audio copy failed, using original URL');
          }
        } catch (copyError) {
          console.warn('⚠️ Audio copy error:', copyError);
        }
      }

      const uploadPayload = {
        id: episodeId,
        topic: currentInput.topic,
        familiarity: currentInput.familiarity,
        duration: currentInput.duration,
        script: currentScript,
        audio_url: finalAudioUrl,
        audio_duration: currentAudio.duration
      };

      console.log('📤 Upload payload:', uploadPayload);

      // Upload episode data to Supabase
      const response = await fetch('/api/episodes', {
        method: 'POST',
        headers,
        body: JSON.stringify(uploadPayload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Upload error response:', errorData);
        console.error('❌ Response status:', response.status);
        throw new Error(`Failed to upload episode to Supabase: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ Episode uploaded successfully:', result);

      setUploadStatus('success');
      setCurrentStep('upload');
      toast.success('Episode uploaded to Supabase successfully!');
    } catch (error) {
      console.error('💥 Upload error:', error);
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

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AuthBanner />
      {renderStepIndicator()}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">

          {/* Step 1 */}
          {currentStep === 'input' && (
            <TopicInput onGenerate={handleGenerateScript} />
          )}

          {/* Step 2 */}
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

          {/* Step 4 */}
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

        {/* Attached Footer Navigation */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Previous Button */}
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

            {/* Next Button */}
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
    </div>
  );
}
