import {
  getAlternativeTechs,
  getDailyCalendarByTechnician,
  fetchCustomerHistory,
  updateAppointmentNote,
  createAppointment,
  reassignAppointmentTechnician,
} from '../../api/_utils/queries/appointment.js';

jest.mock('../../api/_utils/helpers/supabaseClient.js', () => {
  const supabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
  };
  return { supabase };
});

import { supabase as supabaseMock } from '../../api/_utils/helpers/supabaseClient.js';

jest.mock('../../api/_utils/legacy/helper.js', () => ({
  overlap: jest.fn(() => false),
  okayToAssign: jest.fn(async () => true),
  groupAppointments: jest.fn((arr) => ({ grouped: arr })),
}));

import { okayToAssign, groupAppointments } from '../../api/_utils/legacy/helper.js';
import { OverlapError, ConflictError } from '../../api/_utils/helpers/errors.js';

describe('queries/appointment (selected functions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAlternativeTechs returns available technicians', async () => {
    // Appointment
    supabaseMock.single.mockResolvedValueOnce({ data: { id: 1, date: '2025-01-30', start_service_time: '10:00', Services: [] }, error: null });
    // First eq (on appointments.id) should chain, second eq (on technicians.status) should resolve
    supabaseMock.eq.mockImplementationOnce(() => supabaseMock);
    supabaseMock.eq.mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }], error: null });

    const techs = await getAlternativeTechs(1);
    expect(okayToAssign).toHaveBeenCalledTimes(2);
    expect(Array.isArray(techs)).toBe(true);
  });

  test('getDailyCalendarByTechnician groups by technician', async () => {
    // eq should chain; or returns the final result
    supabaseMock.eq.mockImplementationOnce(() => supabaseMock);
    supabaseMock.or.mockResolvedValueOnce({
      data: [
        { id: 10, date: '2025-01-30', start_service_time: '10:00', Technicians: [{ id: 7, name: 'T' }] },
      ],
      error: null,
    });
    const r = await getDailyCalendarByTechnician('2025-01-30');
    expect(r[0].id).toBe(7);
    expect(r[0].appointments.length).toBe(1);
  });

  test('fetchCustomerHistory calls groupAppointments', async () => {
    supabaseMock.eq.mockImplementationOnce(() => supabaseMock);
    supabaseMock.or.mockResolvedValueOnce({ data: [], error: null });
    const r = await fetchCustomerHistory(9);
    expect(groupAppointments).toHaveBeenCalled();
    expect(r).toEqual({ grouped: [] });
  });

  test('updateAppointmentNote throws NotFoundError on missing', async () => {
    supabaseMock.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    await expect(updateAppointmentNote(1, 'x')).rejects.toThrow('Appointment not found.');
  });

  test('createAppointment throws OverlapError when time conflicts', async () => {
    const serviceIds = [1];
    // Services selection resolves at .in(...)
    supabaseMock.in.mockResolvedValueOnce({ data: [{ id: 1, time: 30 }], error: null });
    // appointmenttechnician selection resolves at .eq(...)
    supabaseMock.eq.mockResolvedValueOnce({ data: [{ appointment_id: 100 }], error: null });
    // existing appointments for that day: .in().eq() chain, resolved at .or(...)
    supabaseMock.in.mockImplementationOnce(() => supabaseMock);
    supabaseMock.eq.mockImplementationOnce(() => supabaseMock);
    supabaseMock.or.mockResolvedValueOnce({
      data: [
        { date: '2025-01-30', start_service_time: '10:00', Services: [{ time: 30 }] },
      ],
      error: null,
    });

    const { overlap } = await import('../../api/_utils/legacy/helper.js');
    overlap.mockReturnValueOnce(true);

    await expect(
      createAppointment({
        customer_id: 1,
        date: '2025-01-30',
        start_service_time: '10:00',
        technician_id: 5,
        service_ids: serviceIds,
      })
    ).rejects.toBeInstanceOf(OverlapError);
  });

  test('reassignAppointmentTechnician throws ConflictError when not available', async () => {
    // technician single
    supabaseMock.single.mockResolvedValueOnce({ data: { id: 7, name: 'Tech' }, error: null });
    // appointment single
    supabaseMock.single.mockResolvedValueOnce({ data: { id: 1, date: '2025-01-30', start_service_time: '10:00', Services: [{ id: 1, time: 30 }] }, error: null });

    okayToAssign.mockResolvedValueOnce(false);

    await expect(
      reassignAppointmentTechnician(1, 7)
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
