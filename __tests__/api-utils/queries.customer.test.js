import { searchCustomerByPhone, smartSearchCustomers, validateCustomer, upsertCustomer } from '../../api/_utils/queries/customer.js';

jest.mock('../../api/_utils/helpers/supabaseClient.js', () => {
  const supabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1, phone: '123' }, error: null }),
    single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
  };
  return { supabase };
});

import { supabase as supabaseMock } from '../../api/_utils/helpers/supabaseClient.js';

describe('queries/customer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('searchCustomerByPhone returns data', async () => {
    const r = await searchCustomerByPhone('123');
    expect(supabaseMock.from).toHaveBeenCalledWith('customers');
    expect(r).toEqual({ id: 1, phone: '123' });
  });

  test('smartSearchCustomers returns all for *', async () => {
    supabaseMock.select.mockReturnThis();
    supabaseMock.order.mockResolvedValueOnce({ data: [{ id: 2 }], error: null });
    const r = await smartSearchCustomers('*');
    expect(r).toEqual([{ id: 2 }]);
  });

  test('smartSearchCustomers searches by keyword', async () => {
    supabaseMock.order.mockResolvedValueOnce({ data: [{ id: 3 }], error: null });
    const r = await smartSearchCustomers('ann');
    expect(supabaseMock.or).toHaveBeenCalled();
    expect(r).toEqual([{ id: 3 }]);
  });

  test('validateCustomer returns data', async () => {
    const r = await validateCustomer('123', 'Bob');
    expect(supabaseMock.eq).toHaveBeenCalledWith('name', 'Bob');
    expect(r).toEqual({ id: 1, phone: '123' });
  });

  test('upsertCustomer update by id', async () => {
    // exists
    supabaseMock.maybeSingle.mockResolvedValueOnce({ data: { id: 10 }, error: null });
    supabaseMock.single.mockResolvedValueOnce({ data: { id: 10, name: 'A' }, error: null });
    const r = await upsertCustomer({ id: 10, name: 'A', phone: 'p' });
    expect(r.status).toBe('updated-by-id');
  });

  test('upsertCustomer update by phone when exists', async () => {
    // No id path: find by phone -> exists
    supabaseMock.maybeSingle.mockResolvedValueOnce({ data: { id: 20, phone: 'p' }, error: null });
    supabaseMock.single.mockResolvedValueOnce({ data: { id: 20, name: 'B' }, error: null });
    const r = await upsertCustomer({ name: 'B', phone: 'p' });
    expect(r.status).toBe('updated-by-phone');
  });

  test('upsertCustomer create when not found', async () => {
    // No id path: find by phone -> not found
    supabaseMock.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    supabaseMock.single.mockResolvedValueOnce({ data: { id: 30, name: 'C' }, error: null });
    const r = await upsertCustomer({ name: 'C', phone: 'q' });
    expect(r.status).toBe('created');
  });
});
