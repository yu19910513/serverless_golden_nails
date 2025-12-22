import { getMiscellaneousByTitle } from '../../api/_utils/queries/miscellaneous.js';

jest.mock('../../api/_utils/helpers/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: [{ title: 'Welcome', context: 'Hi' }], error: null }),
  },
}));

describe('queries/miscellaneous.getMiscellaneousByTitle', () => {
  test('returns first row or null', async () => {
    const r1 = await getMiscellaneousByTitle('Welcome');
    expect(r1).toEqual({ title: 'Welcome', context: 'Hi' });
  });
});
