"use client";

import React, { useState } from "react";

interface FeedFormProps {
  onSubmit?: (values: { name: string; description: string }) => void | Promise<void>;
}

export function FeedForm({ onSubmit }: FeedFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      await onSubmit?.({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Create Feed</h2>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-y-6 gap-x-6">
            {/* Name */}
            <label className="sm:col-span-2 self-center text-gray-900 font-semibold">Name</label>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI for Product Managers"
                className="w-full input-field"
                autoComplete="off"
                required
              />
            </div>

            {/* Description */}
            <label className="sm:col-span-2 self-start pt-2 text-gray-900 font-semibold">Description</label>
            <div className="sm:col-span-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary of what this feed covers"
                className="w-full input-field min-h-[96px]"
              />
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div className="bg-gray-100 border-t border-gray-200 p-4 flex justify-end rounded-b-xl">
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-3 rounded-md text-white font-semibold ${submitting ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'} `}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

