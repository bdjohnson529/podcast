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
}

export function TopicView({ topics, onSelect, selectedId }: Props) {
  if (!topics.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">No topics yet</h3>
          <p className="text-gray-600 mt-1">Create your first topic to organize feeds.</p>
        </div>
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
      </ul>
    </div>
  );
}

