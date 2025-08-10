"use client";

import React, { useState } from 'react';

interface Props {
  onCreate: (values: { name: string; description?: string }) => Promise<void>;
}

export function NewFeedForm({ onCreate }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim() || undefined });
      setName('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create feed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900">Create a new feed</h2>
      <p className="text-gray-600 mt-1">Organize episodes by topic, audience, or goal.</p>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-y-6 gap-x-6">
          {/* Name */}
          <label className="sm:col-span-2 self-center text-gray-900 font-semibold">Name</label>
          <div className="sm:col-span-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. AI for Product Managers"
              className="w-full input-field"
              autoComplete="off"
            />
          </div>

          {/* Description */}
          <label className="sm:col-span-2 self-start pt-2 text-gray-900 font-semibold">Description (optional)</label>
          <div className="sm:col-span-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of what this feed covers"
              className="w-full input-field min-h-[96px]"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-3 rounded-md text-white font-semibold ${submitting ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            {submitting ? 'Creating…' : 'Create feed'}
          </button>
        </div>
      </form>
    </div>
  );
}

