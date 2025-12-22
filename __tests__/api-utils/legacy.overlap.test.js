import { DateTime } from 'luxon';
import { overlap } from '../../api/_utils/legacy/overlap.js';

describe('legacy/overlap', () => {
  const existing = [
    {
      date: '2025-01-30',
      start_service_time: '10:00',
      Services: [{ time: 30 }],
    },
  ];
  const startBase = DateTime.fromISO('2025-01-30T00:00', { zone: 'America/Los_Angeles' });

  test('detects overlap inside window', () => {
    const s = startBase.set({ hour: 10, minute: 15 });
    const e = s.plus({ minutes: 15 });
    expect(overlap(existing, s, e)).toBe(true);
  });

  test('no overlap outside window', () => {
    const s = startBase.set({ hour: 11, minute: 0 });
    const e = s.plus({ minutes: 10 });
    expect(overlap(existing, s, e)).toBe(false);
  });
});
