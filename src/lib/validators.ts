export function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function coerceNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.replace(/[,\s]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
