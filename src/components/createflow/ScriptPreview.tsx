'use client';

import { useState } from 'react';
import { PodcastScript } from '@/types';
import { ClockIcon, PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ScriptPreviewProps {
  script: PodcastScript;
  onGenerateAudio: () => void;
  onStartOver: () => void;
  isGeneratingAudio?: boolean;
}

export function ScriptPreview({ script, onGenerateAudio, onStartOver, isGeneratingAudio = false }: ScriptPreviewProps) {
  const [activeTab, setActiveTab] = useState<'concepts' | 'script' | 'challenges' | 'summary' | 'terms' | 'sources'>('concepts');

  const tabs = [
    { id: 'concepts', label: 'Key Concepts'},
    { id: 'script', label: 'Script'},
    { id: 'challenges', label: 'Challenges'},
    { id: 'summary', label: 'Summary'},
    { id: 'terms', label: 'Terms'},
    { id: 'sources', label: 'Sources'}
  ];

  return (
    <div className="space-y-6">
      {isGeneratingAudio ? (
        // Loading Screen
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Generating Your Podcast Audio
            </h2>
            <p className="text-gray-600">
              Converting your script to high-quality speech with AI voices
            </p>
          </div>
          <div className="mt-6 text-xs text-gray-400">
            This typically takes 2-3 minutes depending on script length
          </div>
        </div>
      ) : (
        // Script Content
        <>
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{script.title}</h2>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>~{script.estimatedDuration} minutes</span>
                  </div>
                  <div>
                    {script.transcript?.length || 0} dialogue segments
                  </div>
                  <div>
                    {script.wordCount || 0} words
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-600">{script.overview}</p>
          </div>

          {/* Tabbed Content */}
      <div className="border-t border-gray-200 pt-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'concepts' | 'script' | 'challenges' | 'summary' | 'terms' | 'sources')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'concepts' && (
          <div className="space-y-4">
            {(script.keyConcepts || []).map((concept, index) => (
              <div key={index} className="border-l-4 border-primary-400 pl-4">
                <h4 className="font-medium text-gray-900">{concept.name}</h4>
                <p className="text-gray-600 text-sm mt-1">{concept.description}</p>
                <div className="mt-2">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    {concept.importance}
                  </span>
                </div>
                {(concept.examples?.length || 0) > 0 && (
                  <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                    {(concept.examples || []).map((example, exampleIndex) => (
                      <li key={exampleIndex}>{example}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'script' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Podcast Transcript</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(script.transcript || []).map((line, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                      line.speaker === 'CHRIS' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {line.speaker}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{line.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-700 mb-2">Applications & Examples</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {(script.applicationsAndExamples?.realWorldUses || []).map((use, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{use}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-amber-700 mb-2">Limitations</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {(script.challengesAndConsiderations?.limitations || []).map((limitation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-amber-500 mt-1">•</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-purple-700 mb-2">Complexities</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {(script.challengesAndConsiderations?.complexities || []).map((complexity, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{complexity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-4">
            <ol className="space-y-2">
              {(script.summaryAndTakeaways || []).map((takeaway, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white text-sm font-medium rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{takeaway}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-4">
            {script.glossary && script.glossary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(script.glossary || []).map((term, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900">{term.term}</h4>
                    <p className="text-sm text-gray-600 mt-1">{term.definition}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No key terms available for this topic.</p>
            )}
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-2">
            {(script.sources || []).map((source, index) => (
              <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                <span className="flex-shrink-0 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {source.type}
                </span>
                <div className="flex-1">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {source.title}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </>
      )}
    </div>
  );
}
