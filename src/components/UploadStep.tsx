'use client';

import { PodcastScript, AudioGeneration, PodcastInput } from '@/types';
import { CloudArrowUpIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface UploadStepProps {
  script: PodcastScript;
  audio: AudioGeneration;
  input: PodcastInput;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  isUploading: boolean;
  onUpload: () => void;
  onStartOver: () => void;
}

export function UploadStep({ 
  script, 
  audio, 
  input, 
  uploadStatus, 
  isUploading, 
  onUpload, 
  onStartOver 
}: UploadStepProps) {
  
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="w-8 h-8 text-green-600" />;
      case 'error':
        return <XCircleIcon className="w-8 h-8 text-red-600" />;
      default:
        return <CloudArrowUpIcon className="w-8 h-8 text-primary-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading your podcast to Supabase...';
      case 'success':
        return 'Your podcast has been successfully uploaded and saved!';
      case 'error':
        return 'Upload failed. Please try again.';
      default:
        return 'Ready to upload your podcast to Supabase for permanent storage.';
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Status */}
      <div className="text-center py-8">
        <div className="mb-4 flex justify-center">
          {getStatusIcon()}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your Podcast
        </h2>
        
        <p className={`text-lg mb-6 ${getStatusColor()}`}>
          {getStatusMessage()}
        </p>

        {uploadStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-green-800">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">Episode saved to your library!</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              You can access it anytime from your saved episodes.
            </p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-red-800">
              <XCircleIcon className="w-5 h-5" />
              <span className="font-medium">Upload failed</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              There was an error uploading your episode. Please check your connection and try again.
            </p>
          </div>
        )}
      </div>

      {/* Episode Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Episode Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Topic</p>
            <p className="text-gray-900">{input.topic}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Duration</p>
            <p className="text-gray-900">{input.duration} minute{input.duration !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Familiarity Level</p>
            <p className="text-gray-900 capitalize">{input.familiarity}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Word Count</p>
            <p className="text-gray-900">{script.wordCount || 0} words</p>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">Title</p>
          <p className="text-gray-900">{script.title}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onStartOver}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Create Another</span>
        </button>

        {uploadStatus !== 'success' && (
          <button
            onClick={onUpload}
            disabled={isUploading}
            className="btn-primary flex items-center space-x-2"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            <span>
              {isUploading ? 'Uploading...' : 'Upload to Supabase'}
            </span>
          </button>
        )}

        {uploadStatus === 'success' && (
          <button
            onClick={onStartOver}
            className="btn-primary flex items-center space-x-2"
          >
            <span>Create Another Episode</span>
          </button>
        )}
      </div>
    </div>
  );
}
