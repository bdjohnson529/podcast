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
                {script.transcript?.length || 0} dialogue segments
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

      {/* Key Concepts */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Key Concepts
        </h3>
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
      </div>

      {/* Challenges & Considerations */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Challenges & Considerations
        </h3>
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

      {/* Learning Path */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Learning Path
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Time to Mastery:</span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {script.learningPath?.timeToMastery || 'Variable'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {(script.learningPath?.nextSteps || []).map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Recommended Resources</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {(script.learningPath?.recommendedResources || []).map((resource, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{resource}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Summary & Takeaways */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Summary & Takeaways
        </h3>
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

      {/* Glossary */}
      {script.glossary && script.glossary.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Key Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(script.glossary || []).map((term, index) => (
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
      </div>
    </div>
  );
}
