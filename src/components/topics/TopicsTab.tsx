"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export type TopicsTab = 'view' | 'create';

export function useTopicsTab(): [TopicsTab, (tab: TopicsTab) => void] {
  const searchParams = useSearchParams();
  const active = useMemo<TopicsTab>(() => (searchParams.get('tab') === 'create' ? 'create' : 'view'), [searchParams]);
  function setActive(tab: TopicsTab) {
    const url = new URL(window.location.href);
    if (tab === 'create') url.searchParams.set('tab', 'create'); else url.searchParams.delete('tab');
    window.history.replaceState(null, '', url.toString());
  }
  return [active, setActive];
}

export function TopicsTabs({ active, onChange }: { active: TopicsTab; onChange: (t: TopicsTab) => void }) {
  const tabs: { key: TopicsTab; label: string }[] = [
    { key: 'view', label: 'Topics' },
    { key: 'create', label: 'Create' },
  ];
  return (
    <div className="mb-4 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              active === t.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

