'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { TopicInput } from '@/components/TopicInput';
import { ScriptPreview } from '@/components/ScriptPreview';
import { AudioPlayer } from '@/components/AudioPlayer';
import { LoadingState } from '@/components/LoadingState';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type AppStep = 'input' | 'script' | 'audio';

export default function DemoPage() {
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
    setIsGeneratingScript(true);
    setCurrentScript(null);
    setCurrentAudio(null);

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: currentInput,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCurrentScript(data.script);
      setCurrentStep('script');
      toast.success('Script generated successfully!');
    } catch (error) {
      console.error('Script generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate script');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!currentScript) return;

    setIsGeneratingAudio(true);
    setCurrentAudio(null);

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: currentScript,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCurrentAudio(data.audio);
      setCurrentStep('audio');
      toast.success('Audio generated successfully!');
    } catch (error) {
      console.error('Audio generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleNewEpisode = () => {
    resetCurrentSession();
    setCurrentStep('input');
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      <div className={`flex items-center space-x-2 ${currentStep === 'input' ? 'text-primary-600' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'input' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <span className="font-medium">Create Podcast</span>
      </div>
      
      <div className={`w-12 h-0.5 ${currentStep !== 'input' ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
      
      <div className={`flex items-center space-x-2 ${currentStep === 'script' ? 'text-primary-600' : currentScript ? 'text-green-600' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'script' ? 'bg-primary-600 text-white' : currentScript ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
        <span className="font-medium">Script Preview</span>
      </div>
      
      <div className={`w-12 h-0.5 ${currentStep === 'audio' ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
      
      <div className={`flex items-center space-x-2 ${currentStep === 'audio' ? 'text-primary-600' : currentAudio ? 'text-green-600' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'audio' ? 'bg-primary-600 text-white' : currentAudio ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          3
        </div>
        <span className="font-medium">Audio Preview</span>
      </div>
    </div>
  );

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
        <Toaster position="top-right" />
        
        {/* Demo Banner */}
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-yellow-800">
                <LockClosedIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Demo Mode: Episodes won&apos;t be saved. Sign in to keep your content!
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Link 
                  href="/landing"
                  className="text-sm text-yellow-700 hover:text-yellow-900 transition-colors"
                >
                  Back to Landing
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {renderStepIndicator()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {currentStep === 'input' && (
                <div className="space-y-6">
                  <TopicInput onGenerate={handleGenerateScript} />
                  {isGeneratingScript && (
                    <LoadingState 
                      message="Generating your podcast script..." 
                      subMessage="This may take 30-60 seconds..."
                    />
                  )}
                </div>
              )}

              {currentStep === 'script' && currentScript && (
                <div className="space-y-6">
                  <ScriptPreview 
                    script={currentScript} 
                    onGenerateAudio={handleGenerateAudio}
                    onStartOver={handleNewEpisode}
                  />
                  {isGeneratingAudio && (
                    <LoadingState 
                      message="Generating audio for your podcast..." 
                      subMessage="Converting script to speech..."
                    />
                  )}
                </div>
              )}

              {currentStep === 'audio' && currentAudio && currentScript && (
                <div className="space-y-6">
                  <AudioPlayer 
                    audio={currentAudio} 
                    script={currentScript}
                    onStartOver={handleNewEpisode}
                  />
                </div>
              )}
            </div>

            {/* Sidebar - Demo Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🚀 Demo Experience
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What you can try:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        Generate custom podcast scripts
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        Adjust duration (1-15 minutes)
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        Choose familiarity level
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        Create high-quality audio
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Sign in to unlock:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        Save episodes permanently
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        Access from any device
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        Download audio files
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        Unlimited generations
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Link
                      href="/landing"
                      className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-medium py-3 px-4 rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-sm flex items-center justify-center"
                    >
                      Sign In with Google
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AuthProvider>
  );
}
