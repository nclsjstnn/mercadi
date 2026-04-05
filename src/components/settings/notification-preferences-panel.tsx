"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { updateNotificationPreferences } from "@/actions/notification-preferences";

interface NotificationToggleItem {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

interface NotificationPreferencesPanelProps {
  items: NotificationToggleItem[];
}

export function NotificationPreferencesPanel({ items }: NotificationPreferencesPanelProps) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.key, i.value]))
  );
  const [isPending, startTransition] = useTransition();
  const [savedKey, setSavedKey] = useState<string | null>(null);

  function toggle(key: string) {
    const next = !prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: next }));
    startTransition(async () => {
      await updateNotificationPreferences({ [key]: next });
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    });
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const enabled = prefs[item.key];
        const justSaved = savedKey === item.key;
        return (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={isPending}
              onClick={() => toggle(item.key)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                enabled ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  enabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            {justSaved && (
              <span className="absolute right-4 text-xs text-green-600 animate-in fade-in">
                Guardado
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
