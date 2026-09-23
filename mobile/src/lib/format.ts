/** Shared formatters — Birr currency + human dates (guide §47–48). */

export function formatCompactCount(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n < 1000) return String(Math.floor(n));
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}k`.replace('.0k', 'k');
  }
  const m = n / 1_000_000;
  return `${m >= 100 ? Math.round(m) : Math.round(m * 10) / 10}M`.replace('.0M', 'M');
}

export function formatBirr(value: number | null | undefined, opts?: { suffixPlus?: boolean }): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Br —';
  const n = Number(value);
  const grouped = Math.round(n).toLocaleString('en-US');
  return `Br ${grouped}${opts?.suffixPlus ? '+' : ''}`;
}

export function formatBookingDate(isoDate: string): string {
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function formatTime12h(time: string | null | undefined): string {
  if (!time) return '';
  const m = time.slice(0, 5).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${min} ${ampm}`;
}
