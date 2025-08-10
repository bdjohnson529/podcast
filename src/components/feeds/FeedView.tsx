"use client";

import React from "react";

interface Feed {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

interface Props {
  feeds: Feed[];
  onSelect?: (id: string) => void;
}

export function FeedView({ feeds, onSelect }: Props) {
  if (!feeds.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">No feeds yet</h3>
          <p className="text-gray-600 mt-1">Create your first feed to organize episodes.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <ul className="divide-y divide-gray-200">
        {feeds.map((f) => (
          <li key={f.id} className="p-0">
            <button
              type="button"
              aria-label={`Open feed ${f.name}`}
              onClick={() => onSelect?.(f.id)}
              className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary-700 hover:underline">
                    {f.name}
                  </h3>
                  {f.description ? (
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{f.description}</p>
                  ) : null}
                </div>
                <div className="ml-6 shrink-0 text-sm text-gray-500">
                  {new Date(f.created_at).toLocaleDateString()}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

