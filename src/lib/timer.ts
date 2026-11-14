export type Mode = "tabata" | "round" | "timelap" | "stopwatch";
export type PhaseType = "prepare" | "work" | "rest" | "cycleRest" | "cooldown";
export type DisplayPhase = PhaseType | "idle" | "done";

export type TabataSettings = {
  prepare: number;
  work: number;
  rest: number;
  rounds: number;
  cycles: number;
  cycleRest: number;
  cooldown: number;
};
export type RoundSettings = { prepare: number; work: number; rest: number; rounds: number; cooldown: number };
export type TimelapSettings = { prepare: number; target: number };
export type StopwatchSettings = Record<string, never>;

export type AllSettings = {
  tabata: TabataSettings;
  round: RoundSettings;
  timelap: TimelapSettings;
  stopwatch: StopwatchSettings;
};
export type ModeSettings = Record<string, number>;

export type Phase = {
  type: PhaseType;
  duration: number;
  round?: number;
  cycle?: number;
  countUp?: boolean;
};

export type FieldColor = PhaseType | "count";
export type Field = {
  key: string;
  label: string;
  hint?: string;
  type: "time" | "count";
  color: FieldColor;
};

export const PHASE_LABELS: Record<DisplayPhase, string> = {
  idle: "대기",
  prepare: "준비",
  work: "운동",
  rest: "휴식",
  cycleRest: "사이클 간 휴식",
  cooldown: "쿨다운",
  done: "완료",
};

export const MODE_NAMES: Record<Mode, string> = {
  tabata: "타바타",
  round: "라운드",
  timelap: "타임랩",
  stopwatch: "스톱워치",
};
export const MODES: Mode[] = ["tabata", "round", "timelap", "stopwatch"];

export const FIELDS: Record<Mode, Field[]> = {
  tabata: [
    { key: "prepare", label: "준비 시간", type: "time", color: "prepare" },
    { key: "work", label: "운동 시간", type: "time", color: "work" },
    { key: "rest", label: "휴식 시간", type: "time", color: "rest" },
    { key: "rounds", label: "라운드", hint: "운동 + 휴식 = 1 라운드", type: "count", color: "count" },
    { key: "cycles", label: "사이클", hint: "라운드 전체 = 1 사이클", type: "count", color: "count" },
    { key: "cycleRest", label: "사이클 간 휴식", type: "time", color: "cycleRest" },
    { key: "cooldown", label: "쿨다운 시간", type: "time", color: "cooldown" },
  ],
  round: [
    { key: "prepare", label: "준비 시간", type: "time", color: "prepare" },
    { key: "work", label: "운동 시간", type: "time", color: "work" },
    { key: "rest", label: "휴식 시간", type: "time", color: "rest" },
    { key: "rounds", label: "라운드", hint: "운동 + 휴식 = 1 라운드", type: "count", color: "count" },
    { key: "cooldown", label: "쿨다운", type: "time", color: "cooldown" },
  ],
  timelap: [
    { key: "prepare", label: "준비 시간", type: "time", color: "prepare" },
    { key: "target", label: "타임랩", hint: "목표 시간", type: "time", color: "work" },
  ],
  stopwatch: [],
};

export const DEFAULT_SETTINGS: AllSettings = {
  tabata: { prepare: 10, work: 20, rest: 10, rounds: 8, cycles: 1, cycleRest: 60, cooldown: 60 },
  round: { prepare: 10, work: 60, rest: 30, rounds: 5, cooldown: 60 },
  timelap: { prepare: 10, target: 600 },
  stopwatch: {},
};

export const MAX_MINUTES = 99;
export const MAX_TIME = MAX_MINUTES * 60 + 59;
export const MAX_COUNT = 99;

export function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** 스톱워치용: 1시간이 넘으면 H:MM:SS로 표시한다. */
export function fmtElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 3600) return fmt(s);
  const h = Math.floor(s / 3600);
  return `${h}:${fmt(s % 3600)}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function buildPhases(mode: Mode, settings: ModeSettings): Phase[] {
  const s = settings;
  const phases: Phase[] = [];
  const push = (type: PhaseType, duration: number, extra: Partial<Phase> = {}) => {
    if (duration > 0) phases.push({ type, duration, ...extra });
  };

  if (mode === "stopwatch") {
    push("work", Infinity, { countUp: true });
    return phases;
  }

  push("prepare", s.prepare);

  if (mode === "timelap") {
    push("work", s.target, { countUp: true });
    return phases;
  }

  const cycles = mode === "tabata" ? s.cycles : 1;
  if (s.rounds > 0 && s.work > 0) {
    for (let c = 1; c <= cycles; c++) {
      for (let r = 1; r <= s.rounds; r++) {
        push("work", s.work, { round: r, cycle: c });
        push("rest", s.rest, { round: r, cycle: c });
      }
      if (mode === "tabata" && c < cycles) push("cycleRest", s.cycleRest, { cycle: c });
    }
  }

  push("cooldown", s.cooldown);
  return phases;
}

export function totalDuration(phases: Phase[]): number {
  return phases.reduce((sum, p) => sum + p.duration, 0);
}

export function describePhase(mode: Mode, settings: ModeSettings, p: Phase | undefined): string {
  if (!p) return "";
  if (mode === "tabata" && (p.type === "work" || p.type === "rest")) {
    return `라운드 ${p.round}/${settings.rounds} · 사이클 ${p.cycle}/${settings.cycles}`;
  }
  if (mode === "tabata" && p.type === "cycleRest") {
    return `사이클 ${p.cycle}/${settings.cycles} 완료`;
  }
  if (mode === "round" && (p.type === "work" || p.type === "rest")) {
    return `라운드 ${p.round}/${settings.rounds}`;
  }
  if (mode === "timelap" && p.countUp) {
    return `목표 ${fmt(p.duration)}`;
  }
  return "";
}
