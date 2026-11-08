import { describe, expect, it } from 'vitest';
import { isCurrentReferenceTime, MAX_CURRENT_REFERENCE_AGE_MS } from '../../src/lib/weatherTime';

describe('isCurrentReferenceTime', () => {
  const referenceTime = '2026-11-08T12:00:00.000Z';
  const timestamp = Date.parse(referenceTime);

  it('accepts a current reference at the 60-minute boundary', () => {
    expect(isCurrentReferenceTime(referenceTime, timestamp + MAX_CURRENT_REFERENCE_AGE_MS)).toBe(
      true,
    );
  });

  it('rejects references older than 60 minutes, in the future, or invalid', () => {
    expect(
      isCurrentReferenceTime(referenceTime, timestamp + MAX_CURRENT_REFERENCE_AGE_MS + 1),
    ).toBe(false);
    expect(isCurrentReferenceTime(referenceTime, timestamp - 1)).toBe(false);
    expect(isCurrentReferenceTime('2026-02-31T12:00:00.000Z', timestamp)).toBe(false);
    expect(isCurrentReferenceTime('not-a-timestamp', timestamp)).toBe(false);
    expect(isCurrentReferenceTime(null, timestamp)).toBe(false);
  });
});