export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const fmtDate = (d: string) =>
  new Date(d + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function formatStars(v: number | null) {
  if (!v) return '';
  return '★'.repeat(Math.floor(v)) + (v % 1 ? '½' : '');
}
