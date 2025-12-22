import { DateTime } from 'luxon';

jest.mock('../../api/_utils/queries/appointment.js', () => ({
  getTechnicianAppointmentsByDay: jest.fn(async () => []),
}));

jest.mock('../../api/_utils/legacy/overlap.js', () => ({
  overlap: jest.fn(() => false),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => 'Hello {{name}}'),
}));

jest.mock('handlebars', () => ({
  compile: jest.fn(() => (ctx) => `Hello ${ctx.name}`),
}));

// Mock URL utilities to avoid import.meta handling differences in CJS
jest.mock('url', () => ({
  fileURLToPath: () => '/tmp/mockfile.js',
  pathToFileURL: () => new URL('file:///tmp/mockfile.js'),
}));

import { groupAppointments, now, okayToAssign, validateContactType, generateHtmlFromTemplate } from '../../api/_utils/legacy/helper.js';
import { getTechnicianAppointmentsByDay } from '../../api/_utils/queries/appointment.js';
import { overlap } from '../../api/_utils/legacy/overlap.js';


describe('legacy/helper.groupAppointments', () => {
  test('groups by date relative to today', () => {
    const today = DateTime.now().setZone('America/Los_Angeles').toISODate();
    const appts = [
      { date: today },
      { date: DateTime.now().plus({ days: 1 }).toISODate() },
      { date: DateTime.now().minus({ days: 1 }).toISODate() },
    ];
    const grouped = groupAppointments(appts);
    expect(grouped.present.length).toBe(1);
    expect(grouped.future.length).toBe(1);
    expect(grouped.past.length).toBe(1);
  });
});

describe('legacy/helper.now', () => {
  test('returns LA timezone', () => {
    const dt = now();
    expect(dt.zoneName).toBe('America/Los_Angeles');
  });
});

describe('legacy/helper.validateContactType', () => {
  test('detects email/phone/invalid', () => {
    expect(validateContactType('user@example.com')).toBe('email');
    expect(validateContactType('+14155551234')).toBe('phone');
    expect(validateContactType('nope')).toBe('invalid');
  });
});

describe('legacy/helper.generateHtmlFromTemplate', () => {
  test('compiles template with data', () => {
    const html = generateHtmlFromTemplate({ template: 'appointment/x.handlebars', content: { name: 'Ada' } });
    expect(html).toBe('Hello Ada');
  });
});

describe('legacy/helper.okayToAssign', () => {
  test('returns true when no overlap and not unavailable', async () => {
    const technician = { id: 1, unavailability: '' };
    const appointment = { date: '2025-01-30', start_service_time: '10:00', Services: [{ time: 30 }] };

    const result = await okayToAssign(technician, appointment);
    expect(getTechnicianAppointmentsByDay).toHaveBeenCalled();
    expect(overlap).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
