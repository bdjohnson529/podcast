'use client';

import { PodcastScript } from '@/types';
import { ClockIcon, PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ScriptPreviewProps {
  script: PodcastScript;
  onGenerateAudio: () => void;
  onStartOver: () => void;
}

export function ScriptPreview({ script, onGenerateAudio, onStartOver }: ScriptPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{script.title}</h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>~{script.estimatedDuration} minutes</span>
              </div>
              <div>
                {script.transcript.length} dialogue segments
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onStartOver}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Start Over</span>
            </button>
            <button
              onClick={onGenerateAudio}
              className="btn-primary flex items-center space-x-2"
            >
              <PlayIcon className="h-4 w-4" />
              <span>Generate Audio</span>
            </button>
          </div>
        </div>
        
        <p className="text-gray-600">{script.overview}</p>
      </div>

      {/* Monetization Models */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Monetization Models
        </h3>
        <div className="space-y-4">
          {script.monetizationModels.map((model, index) => (
            <div key={index} className="border-l-4 border-primary-400 pl-4">
              <h4 className="font-medium text-gray-900">{model.name}</h4>
              <p className="text-gray-600 text-sm mt-1">{model.description}</p>
              <div className="mt-2">
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  {model.revenueModel}
                </span>
              </div>
              {model.gtmNotes.length > 0 && (
                <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                  {model.gtmNotes.map((note, noteIndex) => (
                    <li key={noteIndex}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Moats & Risks */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Competitive Moats & Risks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-700 mb-2">Competitive Moats</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {script.moatAndRisks.competitiveMoats.map((moat, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{moat}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-red-700 mb-2">Technical Risks</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {script.moatAndRisks.technicalRisks.map((risk, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-amber-700 mb-2">Regulatory Risks</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {script.moatAndRisks.regulatoryRisks.map((risk, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Build vs Buy */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Build vs Buy Recommendation
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Recommendation:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              script.buildVsBuy.buildRecommendation === 'build' 
                ? 'bg-blue-100 text-blue-800'
                : script.buildVsBuy.buildRecommendation === 'buy'
                ? 'bg-green-100 text-green-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {script.buildVsBuy.buildRecommendation.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600">{script.buildVsBuy.reasoning}</p>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Key Considerations</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {script.buildVsBuy.keyConsiderations.map((consideration, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{consideration}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 30-Day Plan */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          First 30-Day Action Plan
        </h3>
        <ol className="space-y-2">
          {script.firstThirtyDayPlan.map((step, index) => (
            <li key={index} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white text-sm font-medium rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Glossary */}
      {script.glossary && script.glossary.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Key Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {script.glossary.map((term, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900">{term.term}</h4>
                <p className="text-sm text-gray-600 mt-1">{term.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sources & References
        </h3>
        <div className="space-y-2">
          {script.sources.map((source, index) => (
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
      </div>
    </div>
  );
}
