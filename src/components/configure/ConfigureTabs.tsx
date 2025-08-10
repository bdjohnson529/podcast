"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ProfileView } from "./ProfileView";
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

export function ConfigureTabs({ loader, onSubmit }: Props) {
  const [active, setActive] = useState<"view" | "edit">("view");
  const [current, setCurrent] = useState<Values | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v = await loader();
        if (!mounted) return;
        const normalized: Values = {
          company: v?.company || "",
          role: v?.role || "",
          specialization: v?.specialization || "",
          goal: v?.goal || "",
        };
        setCurrent(normalized);
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

  const tabs = useMemo(
    () => [
      { key: "view" as const, label: "Profile" },
      { key: "edit" as const, label: "Edit" },
    ],
    []
  );

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
    <div>
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                active === t.key
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {current && active === "view" && (
        <div className="mt-4">
          <ProfileView
            company={current.company}
            role={current.role}
            specialization={current.specialization}
            goal={current.goal}
          />
        </div>
      )}

      {current && active === "edit" && (
        <div className="mt-4">
          <ProfileForm
            initialCompany={current.company}
            initialRole={current.role}
            initialSpecialization={current.specialization}
            initialGoal={current.goal}
            onSubmit={async (values) => {
              await onSubmit(values);
              setCurrent(values);
              setActive("view");
            }}
          />
        </div>
      )}
    </div>
  );
}

