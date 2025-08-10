"use client";

import React, { useState } from 'react';

interface ProfileFormProps {
  initialCompany?: string;
  initialRole?: string;
  initialSpecialization?: string;
  initialGoal?: string;
  onSubmit?: (values: { company: string; role: string; specialization: string; goal: string }) => void | Promise<void>;
}

export function ProfileForm({
  initialCompany = '',
  initialRole = '',
  initialSpecialization = '',
  initialGoal = '',
  onSubmit,
}: ProfileFormProps) {
  const [company, setCompany] = useState(initialCompany);
  const [role, setRole] = useState(initialRole);
  const [specialization, setSpecialization] = useState(initialSpecialization);
  const [goal, setGoal] = useState(initialGoal);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      await onSubmit?.({ company, role, specialization, goal });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-y-6 gap-x-6">
            {/* Company */}
            <label className="sm:col-span-2 self-center text-gray-900 font-semibold">Company</label>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="KKR, Apollo Global"
                className="w-full input-field"
                autoComplete="organization"
              />
            </div>

            {/* Role */}
            <label className="sm:col-span-2 self-center text-gray-900 font-semibold">Role</label>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Business development, analyst"
                className="w-full input-field"
                autoComplete="organization-title"
              />
            </div>

            {/* Specialization */}
            <label className="sm:col-span-2 self-start pt-2 text-gray-900 font-semibold">Specialization</label>
            <div className="sm:col-span-3">
              <textarea
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Infrastructure investing"
                className="w-full input-field min-h-[96px]"
              />
            </div>

            {/* Goal */}
            <label className="sm:col-span-2 self-start pt-2 text-gray-900 font-semibold">Goal</label>
            <div className="sm:col-span-3">
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Stay up to date with new developments in infrastructure"
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
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

