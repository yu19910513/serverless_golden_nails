import { getAllActiveTechnicians, getAvailableTechnicians, getTechnicianSchedule } from '../../api/_utils/queries/technician.js';

jest.mock('../../api/_utils/helpers/supabaseClient.js', () => {
  const supabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
  };
  return { supabase };
});

import { supabase as supabaseMock } from '../../api/_utils/helpers/supabaseClient.js';

describe('queries/technician', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllActiveTechnicians returns list', async () => {
    supabaseMock.eq.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });
    const r = await getAllActiveTechnicians();
    expect(supabaseMock.from).toHaveBeenCalledWith('technicians');
    expect(r).toEqual([{ id: 1 }]);
  });

  test('getAvailableTechnicians filters by categories', async () => {
    const data = [
      { id: 1, techniciancategory: [{ category_id: 1 }, { category_id: 2 }] },
      { id: 2, techniciancategory: [{ category_id: 1 }] },
    ];
    supabaseMock.in.mockResolvedValueOnce({ data, error: null });
    const r = await getAvailableTechnicians([1, 2]);
    expect(r.map(t => t.id)).toEqual([1]);
  });

  test('getTechnicianSchedule returns data', async () => {
    // first order() should return chain, second resolves
    supabaseMock.order.mockImplementationOnce(() => supabaseMock);
    supabaseMock.order.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });
    const r = await getTechnicianSchedule('2025-01-30');
    expect(Array.isArray(r)).toBe(true);
  });
});
