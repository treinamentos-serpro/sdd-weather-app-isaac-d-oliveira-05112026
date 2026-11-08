export const MAX_CURRENT_REFERENCE_AGE_MS = 60 * 60 * 1000;

export function isCurrentReferenceTime(referenceTime: string | null, now: number): boolean {
  if (
    typeof referenceTime !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(referenceTime) ||
    !Number.isFinite(now)
  ) {
    return false;
  }

  const timestamp = Date.parse(referenceTime);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 19) !== referenceTime.slice(0, 19)
  ) {
    return false;
  }

  const age = now - timestamp;
  return age >= 0 && age <= MAX_CURRENT_REFERENCE_AGE_MS;
}