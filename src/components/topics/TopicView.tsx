"use client";

import React from "react";

interface TopicItem {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

interface Props {
  topics: TopicItem[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  onCreate?: () => void;
}

export function TopicView({ topics, onSelect, selectedId, onCreate }: Props) {
  function CreateTopicButton() {
    return (
      <button
        type="button"
        onClick={() => onCreate?.()}
        className="w-full block text-left p-6 transition-colors hover:bg-gray-50 rounded-xl border border-primary-100"
        aria-label="Create a new topic"
        title="Create a new topic"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
            <h3 className="text-lg font-semibold text-primary-700 hover:underline">
              Create new topic
            </h3>
          </div>
          <div className="ml-6 shrink-0 text-sm text-gray-500">
            {/* Placeholder for alignment */}
          </div>
        </div>
      </button>
    );
  }

  if (!topics.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">No topics yet</h3>
          <p className="text-gray-600 mt-1">Create your first topic to organize feeds.</p>
        </div>
        <CreateTopicButton />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <ul className="divide-y divide-gray-200">
        {topics.map((t) => {
          const isSelected = selectedId === t.id;
          return (
            <li key={t.id} className="p-0">
              <button
                type="button"
                aria-label={`Open topic ${t.name}`}
                onClick={() => onSelect?.(t.id)}
                className={`w-full text-left p-6 transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-lg font-semibold ${isSelected ? 'text-purple-800' : 'text-primary-700 hover:underline'}`}>
                      {t.name}
                    </h3>
                    {t.description ? (
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{t.description}</p>
                    ) : null}
                  </div>
                  <div className={`ml-6 shrink-0 text-sm ${isSelected ? 'text-purple-700' : 'text-gray-500'}`}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        <li className="p-0">
          <CreateTopicButton />
        </li>
      </ul>
    </div>
  );
}

