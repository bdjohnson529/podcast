'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Industry } from '@/types';
import { ChevronDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TopicInputProps {
  onGenerate: () => void;
}

export function TopicInput({ onGenerate }: TopicInputProps) {
  const {
    currentInput,
    availableIndustries,
    setCurrentInput,
    isGeneratingScript,
  } = useAppStore();

  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);

  const handleIndustryToggle = (industry: Industry) => {
    const industries = currentInput.industries || [];
    const isSelected = industries.some(i => i.id === industry.id);
    
    if (isSelected) {
      setCurrentInput({
        industries: industries.filter(i => i.id !== industry.id),
      });
    } else {
      setCurrentInput({
        industries: [...industries, industry],
      });
    }
  };

  const removeIndustry = (industryId: string) => {
    const industries = currentInput.industries || [];
    setCurrentInput({
      industries: industries.filter(i => i.id !== industryId),
    });
  };

  const isFormValid = currentInput.topic.trim().length > 0;

  return (
    <div className="card">
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
            placeholder="e.g., Machine Learning, Quantum Computing, Climate Change, Medieval History"
            className="input-field"
            disabled={isGeneratingScript}
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter any AI technology, model, or capability you want to explore
          </p>
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
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
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
              <span>Quick overview</span>
              <span>Detailed dive</span>
              <span>15 min</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Shorter episodes focus on key concepts, longer ones include more examples and depth
          </p>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Focus Areas (Optional)
          </label>
          
          {/* Selected Focus Areas */}
          {(currentInput.industries?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(currentInput.industries || []).map((industry) => (
                <span
                  key={industry.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {industry.name}
                  <button
                    type="button"
                    onClick={() => removeIndustry(industry.id)}
                    disabled={isGeneratingScript}
                    className="ml-2 hover:text-primary-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Industry Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
              disabled={isGeneratingScript}
              className="input-field flex items-center justify-between"
            >
              <span className="text-gray-500">Select focus areas</span>
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </button>
            
            {isIndustryDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {availableIndustries.map((industry) => {
                  const isSelected = currentInput.industries.some(i => i.id === industry.id);
                  return (
                    <button
                      key={industry.id}
                      type="button"
                      onClick={() => handleIndustryToggle(industry)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                        isSelected ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                    >
                      <span>{industry.name}</span>
                      {isSelected && <PlusIcon className="h-4 w-4 rotate-45" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Use Case */}
        <div>
          <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-2">
            Specific Use Case (Optional)
          </label>
          <textarea
            id="useCase"
            value={currentInput.useCase || ''}
            onChange={(e) => setCurrentInput({ useCase: e.target.value })}
            placeholder="e.g., Automated customer service for e-commerce platforms"
            rows={3}
            className="input-field resize-none"
            disabled={isGeneratingScript}
          />
          <p className="mt-1 text-sm text-gray-500">
            Describe a specific application or use case you&apos;re interested in
          </p>
        </div>

        {/* Generate Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={onGenerate}
            disabled={!isFormValid || isGeneratingScript}
            className="btn-primary w-full text-lg py-3"
          >
            {isGeneratingScript ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Script...</span>
              </div>
            ) : (
              'Generate Podcast Script'
            )}
          </button>
          
          {!isFormValid && (
            <p className="mt-2 text-sm text-red-600">
              Please enter an AI topic to continue
            </p>
          )}

          {/* Debug button for development */}
          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug');
                  const debug = await response.json();
                  console.log('🔍 Debug Info:', debug);
                  alert('Debug info logged to console');
                } catch (error) {
                  console.error('Debug failed:', error);
                  alert('Debug failed - check console');
                }
              }}
              className="mt-2 w-full text-sm text-gray-600 hover:text-gray-800 py-2"
            >
              🔍 Debug API Connections
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
