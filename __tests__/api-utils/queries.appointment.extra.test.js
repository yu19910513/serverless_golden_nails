import {
  getUpcomingAppointmentsForTech,
  searchAppointmentsByKeyword,
  createAppointment,
} from '../../api/_utils/queries/appointment.js';

jest.mock('../../api/_utils/helpers/supabaseClient.js', () => {
  const supabase = {
    from: jest.fn(() => supabase),
    select: jest.fn(() => supabase),
    eq: jest.fn(() => supabase),
    or: jest.fn(() => supabase),
    in: jest.fn(() => supabase),
    order: jest.fn(() => supabase),
    gte: jest.fn(() => supabase),
    ilike: jest.fn(() => supabase),
    update: jest.fn(() => supabase),
    single: jest.fn(),
    insert: jest.fn(() => supabase),
    delete: jest.fn(() => supabase),
  };
  return { supabase };
});

import { supabase as supabaseMock } from '../../api/_utils/helpers/supabaseClient.js';

jest.mock('../../api/_utils/legacy/helper.js', () => ({
  overlap: jest.fn(() => false),
}));

describe('queries/appointment additional coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpcomingAppointmentsForTech', () => {
    test('returns empty array when no appointments linked', async () => {
      // First query: appointmenttechnician eq -> empty
      supabaseMock.eq.mockResolvedValueOnce({ data: [], error: null });

      const r = await getUpcomingAppointmentsForTech(7);
      expect(Array.isArray(r)).toBe(true);
      expect(r.length).toBe(0);
    });

    test('returns upcoming appointments when links exist', async () => {
      // appointmenttechnician eq -> one link
      supabaseMock.eq.mockResolvedValueOnce({ data: [{ appointment_id: 123 }], error: null });
      // appointments in -> chain to gte and final or result
      supabaseMock.in.mockImplementationOnce(() => supabaseMock);
      supabaseMock.gte.mockImplementationOnce(() => supabaseMock);
      supabaseMock.or.mockResolvedValueOnce({
        data: [
          { id: 123, date: '2099-01-01', start_service_time: '10:00', Technicians: [], Services: [] },
        ],
        error: null,
      });

      const r = await getUpcomingAppointmentsForTech(7);
      expect(r.length).toBe(1);
      expect(r[0].id).toBe(123);
    });
  });

  describe('searchAppointmentsByKeyword', () => {
    test('"*" returns future appointments and hydrates relations', async () => {
      // Base appointments query (first `.or` returns builder for chaining)
      supabaseMock.or.mockImplementationOnce(() => supabaseMock);
      // Final date filter `.or` returns builder; resolution happens on `.order`
      supabaseMock.or.mockImplementationOnce(() => supabaseMock);
      supabaseMock.order.mockImplementationOnce(() => supabaseMock);
      supabaseMock.order.mockResolvedValueOnce({
        data: [
          { id: 1, date: '2099-01-01', start_service_time: '10:00', customer_id: 10 },
        ],
        error: null,
      });
      // Hydration: customers
      supabaseMock.in.mockResolvedValueOnce({
        data: [{ id: 10, name: 'Alice', phone: '1', email: 'a@example.com' }],
        error: null,
      });
      // Hydration: appointmenttechnician links
      supabaseMock.in.mockResolvedValueOnce({
        data: [{ appointment_id: 1, technician_id: 7 }],
        error: null,
      });
      // Hydration: technicians
      supabaseMock.in.mockResolvedValueOnce({
        data: [{ id: 7, name: 'Tech' }],
        error: null,
      });
      // Hydration: appointmentservice links
      supabaseMock.in.mockResolvedValueOnce({
        data: [{ appointment_id: 1, service_id: 9 }],
        error: null,
      });
      // Hydration: services
      supabaseMock.in.mockResolvedValueOnce({
        data: [{ id: 9, name: 'Service', time: 30, price: 1 }],
        error: null,
      });

      const r = await searchAppointmentsByKeyword('*');
      expect(r.length).toBe(1);
      expect(r[0].Customer?.name).toBe('Alice');
      expect(r[0].Technicians[0].name).toBe('Tech');
      expect(r[0].Services[0].name).toBe('Service');
    });

    test('"**" returns all appointments including past', async () => {
      // Initial `.or` (note filter) returns builder; later `.order` resolves data
      supabaseMock.or.mockImplementationOnce(() => supabaseMock);
      supabaseMock.order.mockImplementationOnce(() => supabaseMock);
      supabaseMock.order.mockResolvedValueOnce({
        data: [
          { id: 2, date: '2000-01-01', start_service_time: '08:00', customer_id: 11 },
        ],
        error: null,
      });
      // Hydration: customers
      supabaseMock.in.mockImplementationOnce(() => Promise.resolve({
        data: [{ id: 11, name: 'Bob', phone: '2', email: 'b@example.com' }],
        error: null,
      }));
      // Links: tech
      supabaseMock.in.mockResolvedValueOnce({ data: [], error: null });
      // Technicians data
      supabaseMock.in.mockResolvedValueOnce({ data: [], error: null });
      // Links: services
      supabaseMock.in.mockResolvedValueOnce({ data: [], error: null });
      // Services data
      supabaseMock.in.mockResolvedValueOnce({ data: [], error: null });

      const r = await searchAppointmentsByKeyword('**');
      expect(r.length).toBe(1);
      expect(r[0].Customer?.name).toBe('Bob');
      expect(r[0].Technicians.length).toBe(0);
      expect(r[0].Services.length).toBe(0);
    });
  });

  describe('searchAppointmentsByKeyword (keyword mode)', () => {
    test('hydrates via matches across customers/technicians/services', async () => {
      // customers .or => matches id 10
      supabaseMock.or.mockResolvedValueOnce({ data: [{ id: 10 }], error: null });
      // technicians .ilike => id 7
      supabaseMock.ilike.mockResolvedValueOnce({ data: [{ id: 7 }], error: null });
      // services .ilike => id 9
      supabaseMock.ilike.mockResolvedValueOnce({ data: [{ id: 9 }], error: null });

      // appointments by customer
      supabaseMock.in.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });
      // appointments by technician
      supabaseMock.in.mockResolvedValueOnce({ data: [{ appointment_id: 2 }], error: null });
      // appointments by service
      supabaseMock.in.mockResolvedValueOnce({ data: [{ appointment_id: 1 }], error: null });

      // base appt query: in('id', [1,2]) then future date filter
      supabaseMock.in.mockImplementationOnce(() => supabaseMock);
      supabaseMock.or.mockImplementationOnce(() => supabaseMock);
      supabaseMock.order.mockImplementationOnce(() => supabaseMock);
      supabaseMock.order.mockResolvedValueOnce({
        data: [
          { id: 1, date: '2099-01-01', start_service_time: '10:00', customer_id: 10 },
          { id: 2, date: '2099-01-02', start_service_time: '09:00', customer_id: 10 },
        ],
        error: null,
      });

      // Hydration: customers
      supabaseMock.in.mockResolvedValueOnce({
        data: [{ id: 10, name: 'Alice', phone: '1', email: 'a@example.com' }],
        error: null,
      });
      // Hydration: appointmenttechnician links
      supabaseMock.in.mockResolvedValueOnce({
        data: [
          { appointment_id: 1, technician_id: 7 },
          { appointment_id: 2, technician_id: 7 },
        ],
        error: null,
      });
      // Hydration: technicians
      supabaseMock.in.mockResolvedValueOnce({ data: [{ id: 7, name: 'Tech' }], error: null });
      // Hydration: appointmentservice links
      supabaseMock.in.mockResolvedValueOnce({
        data: [
          { appointment_id: 1, service_id: 9 },
          { appointment_id: 2, service_id: 9 },
        ],
        error: null,
      });
      // Hydration: services
      supabaseMock.in.mockResolvedValueOnce({
        data: [{ id: 9, name: 'Service', time: 30, price: 1 }],
        error: null,
      });

      const r = await searchAppointmentsByKeyword('alice');
      expect(r.length).toBe(2);
      expect(r[0].Customer?.name).toBe('Alice');
      expect(r[0].Technicians[0].name).toBe('Tech');
      expect(r[0].Services[0].name).toBe('Service');
    });
  });

  describe('createAppointment (more validations + happy path)', () => {
    test('throws on missing date/start_service_time', async () => {
      await expect(
        createAppointment({ customer_id: 1, technician_id: 7, service_ids: [1] })
      ).rejects.toThrow('Date and start service time are required.');
    });

    test('throws when services mismatch count', async () => {
      // services: return only one while asking for two
      supabaseMock.in.mockResolvedValueOnce({ data: [{ id: 1, time: 30 }], error: null });
      await expect(
        createAppointment({
          customer_id: 1,
          date: '2025-01-30',
          start_service_time: '10:00',
          technician_id: 7,
          service_ids: [1, 2],
        })
      ).rejects.toThrow('Some services are invalid or not found.');
    });

    test('happy path inserts appointment and links', async () => {
      // services
      supabaseMock.in.mockResolvedValueOnce({
        data: [{ id: 1, time: 30 }, { id: 2, time: 30 }],
        error: null,
      });
      // appt technician eq
      supabaseMock.eq.mockResolvedValueOnce({ data: [], error: null });
      // existing appointments chain
      supabaseMock.in.mockImplementationOnce(() => supabaseMock);
      supabaseMock.eq.mockImplementationOnce(() => supabaseMock);
      supabaseMock.or.mockResolvedValueOnce({ data: [], error: null });

      // insert appointment -> select -> single
      supabaseMock.insert.mockImplementationOnce(() => supabaseMock);
      supabaseMock.select.mockReturnThis();
      supabaseMock.single.mockResolvedValueOnce({
        data: { id: 1001, customer_id: 1, date: '2025-01-30', start_service_time: '10:00' },
        error: null,
      });

      // link technicians
      supabaseMock.insert.mockResolvedValueOnce({ error: null });
      // link services
      supabaseMock.insert.mockResolvedValueOnce({ error: null });

      const appt = await createAppointment({
        customer_id: 1,
        date: '2025-01-30',
        start_service_time: '10:00',
        technician_id: 7,
        service_ids: [1, 2],
      });
      expect(appt.id).toBe(1001);
    });
  });
});
