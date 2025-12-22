import { getCategorizedServices } from '../../api/_utils/queries/service.js';

jest.mock('../../api/_utils/helpers/supabaseClient.js', () => {
  const supabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  };
  return { supabase };
});

import { supabase as supabaseMock } from '../../api/_utils/helpers/supabaseClient.js';

describe('queries/service.getCategorizedServices', () => {
  test('returns nested categories/services', async () => {
    supabaseMock.order.mockImplementationOnce(() => supabaseMock); // first order returns chain
    supabaseMock.order.mockResolvedValueOnce({ data: [{ id: 1, services: [{ id: 2 }] }], error: null }); // second order resolves
    const r = await getCategorizedServices();
    expect(Array.isArray(r)).toBe(true);
    expect(r[0].services).toBeDefined();
  });
});
