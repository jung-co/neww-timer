"use client";

import { useEffect, useMemo, useState } from "react";
import SettingsScreen from "./SettingsScreen";
import { useStoredSettings } from "@/hooks/useStoredSettings";
import { useTimer } from "@/hooks/useTimer";
import {
  buildPhases,
  describePhase,
  fmt,
  fmtElapsed,
  MODE_NAMES,
  MODES,
  PHASE_LABELS,
  totalDuration,
  type DisplayPhase,
  type ModeSettings,
} from "@/lib/timer";

type View = {
  bg: DisplayPhase;
  label: string;
  time: string;
  sub: string;
  next: string;
  bottom: { label: string; seconds: number } | null;
  progress: number;
};

export default function TimerApp() {
  const { mode, setMode, settings, saveModeSettings, resetAll, loaded } = useStoredSettings();
  const modeSettings = settings[mode] as ModeSettings;
  const phases = useMemo(() => buildPhases(mode, modeSettings), [mode, modeSettings]);
  const timer = useTimer(phases);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const busy = timer.status === "running" || timer.status === "paused";
  const isStopwatch = mode === "stopwatch";

  const view = ((): View => {
    if (isStopwatch) {
      const started = timer.status !== "idle";
      return {
        bg: started ? "work" : "idle",
        label: MODE_NAMES.stopwatch + (timer.status === "paused" ? " (일시정지)" : ""),
        time: fmtElapsed(timer.elapsed),
        sub: "",
        next: started ? "" : "시작을 누르면 시간이 올라갑니다",
        bottom: null,
        progress: started ? (timer.elapsed % 60) / 60 : 0,
      };
    }

    if (!phases.length) {
      return {
        bg: "idle",
        label: "시간을 설정하세요",
        time: "00:00",
        sub: "",
        next: "우측 상단 ‘시간 설정’에서 설정할 수 있습니다",
        bottom: null,
        progress: 0,
      };
    }

    if (timer.status === "idle" || !timer.phase) {
      const first = phases[0];
      return {
        bg: "idle",
        label: `${MODE_NAMES[mode]} · 준비 완료`,
        time: fmt(first.countUp ? 0 : first.duration),
        sub: mode === "timelap" ? `목표 ${fmt(settings.timelap.target)}` : "",
        next: `첫 구간: ${PHASE_LABELS[first.type]}`,
        bottom: { label: "총 운동 시간", seconds: totalDuration(phases) },
        progress: 0,
      };
    }

    const phase = timer.phase;

    if (timer.status === "done") {
      return {
        bg: "done",
        label: "운동 완료!",
        time: fmt(phase.countUp ? phase.duration : 0),
        sub: `총 ${fmt(totalDuration(phases))}`,
        next: "수고하셨습니다",
        bottom: { label: "전체 남은 시간", seconds: 0 },
        progress: 0,
      };
    }

    const remaining = phase.duration - timer.elapsed;
    const next = phases[timer.index + 1];
    const restTotal = totalDuration(phases.slice(timer.index + 1)) + remaining;

    return {
      bg: phase.type,
      label: PHASE_LABELS[phase.type] + (timer.status === "paused" ? " (일시정지)" : ""),
      time: phase.countUp ? fmt(timer.elapsed) : fmt(Math.ceil(remaining)),
      sub: describePhase(mode, modeSettings, phase),
      next: next ? `다음: ${PHASE_LABELS[next.type]} ${fmt(next.duration)}` : "마지막 구간",
      bottom: { label: "전체 남은 시간", seconds: Math.ceil(restTotal) },
      progress: timer.elapsed / phase.duration,
    };
  })();

  useEffect(() => {
    document.body.dataset.phase = view.bg;
  }, [view.bg]);

  const { toggle } = timer;
  useEffect(() => {
    if (settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (phases.length) toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, phases.length, toggle]);

  const openSettings = () => {
    timer.pause();
    setSettingsOpen(true);
  };

  const handleReset = () => {
    if (!confirm("진행 중인 타이머와 모든 시간 설정을 0으로 초기화할까요?")) return;
    resetAll();
  };

  const startLabel =
    timer.status === "running" ? "일시정지" : timer.status === "paused" ? "계속" : timer.status === "done" ? "다시 시작" : "시작";

  return (
    <>
      <div className="progress-fill" aria-hidden="true" style={{ transform: `scaleY(${view.progress.toFixed(4)})` }} />

      <div className="app" style={loaded ? undefined : { visibility: "hidden" }}>
        <header className="top-bar">
          <button type="button" className="icon-btn reset-btn" aria-label="초기화" title="초기화" onClick={handleReset}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <polyline points="3 3 3 9 9 9" />
            </svg>
            <span>초기화</span>
          </button>

          <nav className="mode-tabs" role="tablist">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={m === mode}
                className={`mode-tab${m === mode ? " active" : ""}`}
                disabled={busy}
                onClick={() => setMode(m)}
              >
                {MODE_NAMES[m]}
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="icon-btn settings-btn"
            aria-label="시간 설정"
            title={isStopwatch ? "스톱워치는 설정할 시간이 없습니다" : "시간 설정"}
            disabled={isStopwatch}
            onClick={openSettings}
          >
            <span>시간 설정</span>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2 2" />
              <path d="M9 2h6" />
            </svg>
          </button>
        </header>

        <main className="timer-area">
          <div className="phase-label">{view.label}</div>
          <div className={`timer${view.time.length > 5 ? " long" : ""}`}>{view.time}</div>
          <div className="sub-info">{view.sub}</div>
          <div className="next-info">{view.next}</div>

          <div className="controls">
            <button type="button" className="main-btn" disabled={!phases.length} onClick={toggle}>
              {startLabel}
            </button>
            {isStopwatch ? (
              <button type="button" className="ghost-btn" disabled={timer.status === "idle"} onClick={timer.reset}>
                ↺ 리셋
              </button>
            ) : (
              <button type="button" className="ghost-btn" disabled={!busy} onClick={timer.skip}>
                다음 구간 ▶
              </button>
            )}
          </div>
        </main>

        {view.bottom && (
          <footer className="bottom-bar">
            <span className="bottom-label">{view.bottom.label}</span>
            <span className="bottom-value">{fmt(view.bottom.seconds)}</span>
          </footer>
        )}
      </div>

      {settingsOpen && (
        <SettingsScreen
          mode={mode}
          initial={modeSettings}
          onClose={() => setSettingsOpen(false)}
          onSave={(values) => {
            saveModeSettings(mode, values);
            setSettingsOpen(false);
          }}
        />
      )}
    </>
  );
}
