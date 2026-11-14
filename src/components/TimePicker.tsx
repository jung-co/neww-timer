"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clamp, MAX_MINUTES, MAX_TIME } from "@/lib/timer";

type WheelProps = {
  max: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
};

function Wheel({ max, value, onChange, label }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const items = Array.from({ length: max + 1 }, (_, i) => i);

  const itemHeight = () => (ref.current?.firstElementChild as HTMLElement | null)?.offsetHeight ?? 48;

  const scrollToValue = (v: number, smooth: boolean) => {
    ref.current?.scrollTo({ top: v * itemHeight(), behavior: smooth ? "smooth" : "auto" });
  };

  useLayoutEffect(() => {
    scrollToValue(value, false);
    // 처음 열릴 때만 위치를 맞춘다. 이후에는 사용자의 스크롤이 값을 결정한다.
  }, []);

  const select = (v: number) => {
    const next = clamp(v, 0, max);
    onChange(next);
    scrollToValue(next, true);
  };

  return (
    <div
      ref={ref}
      className="wheel"
      tabIndex={0}
      aria-label={label}
      role="listbox"
      onScroll={(e) => {
        const v = clamp(Math.round(e.currentTarget.scrollTop / itemHeight()), 0, max);
        if (v !== value) onChange(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          select(value + (e.key === "ArrowDown" ? 1 : -1));
        }
      }}
    >
      {items.map((i) => (
        <div
          key={i}
          role="option"
          aria-selected={i === value}
          className={`wheel-item${i === value ? " selected" : ""}`}
          onClick={() => select(i)}
        >
          {String(i).padStart(2, "0")}
        </div>
      ))}
    </div>
  );
}

type TimePickerProps = {
  title: string;
  seconds: number;
  onDone: (seconds: number) => void;
  onCancel: () => void;
};

export default function TimePicker({ title, seconds, onDone, onCancel }: TimePickerProps) {
  const [min, setMin] = useState(Math.floor(seconds / 60));
  const [sec, setSec] = useState(seconds % 60);

  const done = () => onDone(clamp(min * 60 + sec, 0, MAX_TIME));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") done();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="picker">
      <div className="picker-backdrop" onClick={onCancel} />
      <div className="picker-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="picker-header">
          <button type="button" className="picker-action" onClick={onCancel}>
            취소
          </button>
          <h3>{title}</h3>
          <button type="button" className="picker-action strong" onClick={done}>
            완료
          </button>
        </header>
        <div className="picker-body">
          <div className="picker-highlight" aria-hidden="true" />
          <div className="wheel-group">
            <Wheel max={MAX_MINUTES} value={min} onChange={setMin} label="분" />
            <span className="wheel-unit">분</span>
          </div>
          <div className="wheel-group">
            <Wheel max={59} value={sec} onChange={setSec} label="초" />
            <span className="wheel-unit">초</span>
          </div>
        </div>
      </div>
    </div>
  );
}
