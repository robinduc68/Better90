/** Formatting helpers for metrics. Keep numbers short and aligned. */

export function formatKg(kg: number | null | undefined, withUnit = true): string {
  if (kg === null || kg === undefined) return '—';
  const v = Math.round(kg * 10) / 10;
  const s = Number.isInteger(v) ? String(v) : v.toFixed(1);
  return withUnit ? `${s} kg` : s;
}

export function formatSignedKg(kg: number): string {
  const v = Math.round(kg * 10) / 10;
  const s = Number.isInteger(v) ? String(Math.abs(v)) : Math.abs(v).toFixed(1);
  return `${v >= 0 ? '+' : '−'}${s} kg`;
}

/** 1750 → "1.75", 2000 → "2.0", 2500 → "2.5" */
export function formatLiters(ml: number): string {
  const l = Math.round(ml / 10) / 100;
  return Number.isInteger(l * 10) ? l.toFixed(1) : l.toFixed(2);
}

export function formatPercent(fraction: number): string {
  return `${Math.round(Math.max(0, fraction) * 100)}%`;
}

export function formatSignedPercent(fraction: number): string {
  const p = Math.round(fraction * 100);
  return `${p >= 0 ? '+' : '−'}${Math.abs(p)}%`;
}

/** 452 → "7h 32m" */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Seconds → "38:24" or "1:02:10" */
export function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatVolume(kg: number): string {
  return `${Math.round(kg).toLocaleString('en-US')} kg`;
}

export function formatCount(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
