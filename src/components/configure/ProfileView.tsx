"use client";

import React from "react";

interface Props {
  company?: string;
  role?: string;
  specialization?: string;
  goal?: string;
}

export function ProfileView({ company, role, specialization, goal }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h2>

        <dl className="space-y-8">
          <div>
            <dt className="text-sm font-semibold text-gray-600">Company</dt>
            <dd className="mt-1 text-gray-900">{company || <span className="text-gray-400">Not set</span>}</dd>
          </div>

          <div>
            <dt className="text-sm font-semibold text-gray-600">Role</dt>
            <dd className="mt-1 text-gray-900">{role || <span className="text-gray-400">Not set</span>}</dd>
          </div>

          <div>
            <dt className="text-sm font-semibold text-gray-600">Specialization</dt>
            <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{specialization || <span className="text-gray-400">Not set</span>}</dd>
          </div>

          <div>
            <dt className="text-sm font-semibold text-gray-600">Goal</dt>
            <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{goal || <span className="text-gray-400">Not set</span>}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

