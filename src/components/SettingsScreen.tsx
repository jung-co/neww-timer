"use client";

import { useEffect, useMemo, useState } from "react";
import TimePicker from "./TimePicker";
import {
  buildPhases,
  clamp,
  FIELDS,
  fmt,
  MAX_COUNT,
  MAX_TIME,
  MODE_NAMES,
  totalDuration,
  type Field,
  type Mode,
  type ModeSettings,
} from "@/lib/timer";

type Props = {
  mode: Mode;
  initial: ModeSettings;
  onSave: (values: ModeSettings) => void;
  onClose: () => void;
};

function CountInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value).padStart(2, "0"));

  useEffect(() => setText(String(value).padStart(2, "0")), [value]);

  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={MAX_COUNT}
      aria-label={label}
      value={text}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        setText(e.target.value);
        onChange(clamp(parseInt(e.target.value, 10) || 0, 0, MAX_COUNT));
      }}
      onBlur={() => setText(String(value).padStart(2, "0"))}
    />
  );
}

export default function SettingsScreen({ mode, initial, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<ModeSettings>(() => ({ ...initial }));
  const [pickerField, setPickerField] = useState<Field | null>(null);

  const total = useMemo(() => totalDuration(buildPhases(mode, draft)), [mode, draft]);

  const setValue = (key: string, v: number) => setDraft((d) => ({ ...d, [key]: v }));
  const step = (f: Field, dir: 1 | -1) =>
    setValue(f.key, clamp(draft[f.key] + dir, 0, f.type === "time" ? MAX_TIME : MAX_COUNT));

  useEffect(() => {
    if (pickerField) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerField, onClose]);

  return (
    <div className="settings-screen">
      <div className="settings-sticky">
        <div className="settings-sticky-inner">
          <header className="settings-header">
            <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>뒤로</span>
            </button>
            <h2>{MODE_NAMES[mode]} 시간 설정</h2>
            <button type="button" className="save-btn" onClick={() => onSave(draft)}>
              저장
            </button>
          </header>
          <div className="settings-summary">{total > 0 ? `총 운동 시간 ${fmt(total)}` : "설정된 시간이 없습니다"}</div>
        </div>
      </div>

      <div className="settings-panel">
        <form className="settings-form" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          {FIELDS[mode].map((f) => (
            <div key={f.key} className="field" data-color={f.color}>
              <div className="field-label">
                {f.label}
                {f.hint && <small>{f.hint}</small>}
              </div>
              <div className="field-input">
                <button type="button" className="step-btn" aria-label={`${f.label} 줄이기`} onClick={() => step(f, -1)}>
                  −
                </button>
                {f.type === "time" ? (
                  <button
                    type="button"
                    className="time-btn"
                    aria-label={`${f.label} ${fmt(draft[f.key])}, 눌러서 변경`}
                    onClick={() => setPickerField(f)}
                  >
                    {fmt(draft[f.key])}
                  </button>
                ) : (
                  <CountInput label={f.label} value={draft[f.key]} onChange={(v) => setValue(f.key, v)} />
                )}
                <button type="button" className="step-btn" aria-label={`${f.label} 늘리기`} onClick={() => step(f, 1)}>
                  +
                </button>
              </div>
            </div>
          ))}
        </form>
      </div>

      {pickerField && (
        <TimePicker
          title={pickerField.label}
          seconds={draft[pickerField.key]}
          onCancel={() => setPickerField(null)}
          onDone={(v) => {
            setValue(pickerField.key, v);
            setPickerField(null);
          }}
        />
      )}
    </div>
  );
}
