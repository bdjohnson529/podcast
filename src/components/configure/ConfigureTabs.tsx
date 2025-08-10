"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ProfileLoader } from "./ProfileLoader";
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

  const handleLoaded = useCallback((v: Values) => {
    setCurrent(v);
  }, []);

  const tabs = useMemo(
    () => [
      { key: "view" as const, label: "Profile" },
      { key: "edit" as const, label: "Edit" },
    ],
    []
  );

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

      {/* Load once, then render either view or edit */}
      <ProfileLoader
        loader={async () => {
          const v = await loader();
          const normalized: Values = {
            company: v?.company || "",
            role: v?.role || "",
            specialization: v?.specialization || "",
            goal: v?.goal || "",
          };
          setCurrent(normalized);
          return normalized;
        }}
        onSubmit={async (values) => {
          await onSubmit(values);
          setCurrent(values);
          setActive("view");
        }}
      />

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

