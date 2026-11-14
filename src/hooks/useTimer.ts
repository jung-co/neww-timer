"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Phase } from "@/lib/timer";
import { beep, ensureAudio, finishFanfare } from "@/lib/sound";
import { releaseWakeLock, requestWakeLock } from "@/lib/wakeLock";

export type TimerStatus = "idle" | "running" | "paused" | "done";

type Engine = {
  status: TimerStatus;
  index: number;
  /** 현재 구간 시작 시각 (performance.now 기준) */
  phaseStart: number;
  elapsedBeforePause: number;
  lastBeepSecond: number | null;
};

const initialEngine = (): Engine => ({
  status: "idle",
  index: 0,
  phaseStart: 0,
  elapsedBeforePause: 0,
  lastBeepSecond: null,
});

function elapsedOf(e: Engine, now = performance.now()) {
  return e.status === "running" ? e.elapsedBeforePause + (now - e.phaseStart) / 1000 : e.elapsedBeforePause;
}

/** `phases`는 호출하는 쪽에서 메모이즈해야 한다. 참조가 바뀌면 타이머가 처음 상태로 돌아간다. */
export function useTimer(phases: Phase[]) {
  const engine = useRef<Engine>(initialEngine());
  const phasesRef = useRef(phases);
  const rafRef = useRef<number | null>(null);
  const [, rerender] = useReducer((x: number) => x + 1, 0);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const finish = useCallback(() => {
    const e = engine.current;
    const list = phasesRef.current;
    e.status = "done";
    e.index = list.length - 1;
    e.elapsedBeforePause = list[e.index]?.duration ?? 0;
    stopLoop();
    releaseWakeLock();
    finishFanfare();
  }, [stopLoop]);

  const goToPhase = useCallback(
    (index: number, carry = 0) => {
      const e = engine.current;
      if (index >= phasesRef.current.length) {
        finish();
        return;
      }
      e.index = index;
      e.elapsedBeforePause = carry;
      e.phaseStart = performance.now();
      e.lastBeepSecond = null;
      beep(1320, 0.3);
    },
    [finish]
  );

  const tick = useCallback(() => {
    const e = engine.current;
    const phase = phasesRef.current[e.index];
    const elapsed = elapsedOf(e);

    if (elapsed >= phase.duration) {
      // 프레임 지연으로 넘친 시간은 다음 구간으로 이월
      goToPhase(e.index + 1, Math.min(elapsed - phase.duration, 0.5));
      if (e.status === "done") {
        rerender();
        return;
      }
    } else {
      const remaining = Math.ceil(phase.duration - elapsed);
      if (remaining >= 1 && remaining <= 3 && e.lastBeepSecond !== remaining) {
        e.lastBeepSecond = remaining;
        beep(880, 0.12);
      }
    }

    rerender();
    rafRef.current = requestAnimationFrame(tick);
  }, [goToPhase]);

  useEffect(() => {
    phasesRef.current = phases;
    stopLoop();
    releaseWakeLock();
    engine.current = initialEngine();
    rerender();
  }, [phases, stopLoop]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && engine.current.status === "running") void requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      stopLoop();
      releaseWakeLock();
    };
  }, [stopLoop]);

  const start = useCallback(() => {
    if (!phasesRef.current.length) return;
    ensureAudio();
    if (engine.current.status === "done") engine.current = initialEngine();
    const e = engine.current;
    if (e.status === "idle") beep(1320, 0.25);
    e.status = "running";
    e.phaseStart = performance.now();
    void requestWakeLock();
    stopLoop();
    tick();
  }, [stopLoop, tick]);

  const pause = useCallback(() => {
    const e = engine.current;
    if (e.status !== "running") return;
    e.elapsedBeforePause = elapsedOf(e);
    e.status = "paused";
    stopLoop();
    releaseWakeLock();
    rerender();
  }, [stopLoop]);

  const reset = useCallback(() => {
    stopLoop();
    releaseWakeLock();
    engine.current = initialEngine();
    rerender();
  }, [stopLoop]);

  const toggle = useCallback(() => {
    if (engine.current.status === "running") pause();
    else start();
  }, [pause, start]);

  const skip = useCallback(() => {
    const e = engine.current;
    if (e.status !== "running" && e.status !== "paused") return;
    const wasPaused = e.status === "paused";
    goToPhase(e.index + 1);
    if (wasPaused && e.status === "paused") e.elapsedBeforePause = 0;
    rerender();
  }, [goToPhase]);

  const e = engine.current;
  const phase = phases[e.index] as Phase | undefined;
  return {
    status: e.status,
    index: e.index,
    phase,
    elapsed: phase ? Math.min(elapsedOf(e), phase.duration) : 0,
    start,
    pause,
    toggle,
    skip,
    reset,
  };
}
