let audioCtx: AudioContext | null = null;

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

/** 브라우저 자동재생 정책 때문에 사용자 클릭 이벤트 안에서 호출해야 한다. */
export function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx?.state === "suspended") void audioCtx.resume();
}

export function beep(freq = 880, duration = 0.12, volume = 0.25) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export function finishFanfare() {
  beep(1046, 0.2);
  setTimeout(() => beep(1318, 0.2), 220);
  setTimeout(() => beep(1568, 0.45), 440);
}
