"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, MODES, type AllSettings, type Mode, type ModeSettings } from "@/lib/timer";

const STORAGE_KEY = "workout-timer-v1";

type Stored = { mode?: Mode; settings?: Partial<Record<Mode, ModeSettings>> };

function load(): { mode: Mode; settings: AllSettings } {
  let stored: Stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {};
  } catch {
    /* 손상된 값은 무시 */
  }
  const settings = structuredClone(DEFAULT_SETTINGS);
  for (const m of MODES) Object.assign(settings[m], stored.settings?.[m]);
  return { mode: stored.mode && MODES.includes(stored.mode) ? stored.mode : "tabata", settings };
}

export function useStoredSettings() {
  const [mode, setMode] = useState<Mode>("tabata");
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // localStorage는 브라우저에서만 읽을 수 있으므로 마운트 후 불러온다.
  useEffect(() => {
    const s = load();
    setMode(s.mode);
    setSettings(s.settings);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, settings }));
  }, [loaded, mode, settings]);

  const saveModeSettings = useCallback((m: Mode, values: ModeSettings) => {
    setSettings((prev) => ({ ...prev, [m]: { ...values } }));
  }, []);

  const resetAll = useCallback(() => {
    setSettings((prev) => {
      const next = structuredClone(prev) as Record<Mode, ModeSettings>;
      for (const m of MODES) for (const k of Object.keys(next[m])) next[m][k] = 0;
      return next as AllSettings;
    });
  }, []);

  return { mode, setMode, settings, saveModeSettings, resetAll, loaded };
}
