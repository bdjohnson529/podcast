"use client";

import React, { useEffect, useState } from "react";
import { ProfileForm } from "./ProfileForm";

interface Values {
  company: string;
  role: string;
  specialization: string;
  goal: string;
}

interface Props {
  loader: () => Promise<Values | null>;
  onSubmit: (values: Values) => Promise<void>;
}

export function ProfileLoader({ loader, onSubmit }: Props) {
  const [initial, setInitial] = useState<Values | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await loader();
        if (!mounted) return;
        setInitial(
          data ?? { company: "", role: "", specialization: "", goal: "" }
        );
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loader]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <ProfileForm
      initialCompany={initial?.company}
      initialRole={initial?.role}
      initialSpecialization={initial?.specialization}
      initialGoal={initial?.goal}
      onSubmit={onSubmit}
    />
  );
}

