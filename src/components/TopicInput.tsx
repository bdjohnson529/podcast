'use client';

import { useAppStore } from '@/lib/store';

interface TopicInputProps {
  onGenerate: () => void;
}

export function TopicInput({ onGenerate }: TopicInputProps) {
  const {
    currentInput,
    setCurrentInput,
    isGeneratingScript,
  } = useAppStore();

  const isFormValid = currentInput.topic.trim().length > 0;

  return (
    <div>
      {isGeneratingScript ? (
        // Loading Screen
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Generating Your Podcast Script
            </h2>
            <p className="text-gray-600">
              Our AI is crafting a personalized learning experience for &ldquo;{currentInput.topic}&rdquo;
            </p>
          </div>
          <div className="mt-6 text-xs text-gray-400">
            This typically takes 30-60 seconds
          </div>
        </div>
      ) : (
        // Form Content
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Generate Your Learning Podcast
            </h2>
            <p className="text-gray-600">
              Enter any topic and get a detailed AI-generated podcast tailored to your preferred length (1-15 minutes) to accelerate your learning.
            </p>
          </div>

          <div className="space-y-6">
        {/* Topic Input */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            Topic *
          </label>
          <input
            type="text"
            id="topic"
            value={currentInput.topic}
            onChange={(e) => setCurrentInput({ topic: e.target.value })}
            placeholder="Enter any topic you want to learn about"
            className="input-field"
            disabled={isGeneratingScript}
          />
        </div>

        {/* Familiarity Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Familiarity Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'new', label: 'New to this', description: 'Explain concepts clearly' },
              { value: 'some', label: 'Some background', description: 'Brief explanations' },
              { value: 'expert', label: 'Expert', description: 'Technical depth' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCurrentInput({ familiarity: option.value as any })}
                disabled={isGeneratingScript}
                className={`p-3 text-left border rounded-lg transition-all ${
                  currentInput.familiarity === option.value
                    ? 'border-blue-500 bg-blue-100 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Episode Length */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Episode Length: {currentInput.duration} minute{currentInput.duration !== 1 ? 's' : ''}
          </label>
          <div className="space-y-3">
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={currentInput.duration}
              onChange={(e) => setCurrentInput({ duration: parseInt(e.target.value) })}
              disabled={isGeneratingScript}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 min</span>
              <span>15 min</span>
            </div>
          </div>
        </div>
          </div>
        </>
      )}
    </div>
  );
}
