let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch {
    /* 지원하지 않는 환경 */
  }
}

export function releaseWakeLock() {
  if (wakeLock) void wakeLock.release();
  wakeLock = null;
}
