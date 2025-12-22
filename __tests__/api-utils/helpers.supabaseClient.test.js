import * as supaModule from '../../api/_utils/helpers/supabaseClient.js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ __mocked: true })),
}));

describe('helpers/supabaseClient', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon';
    jest.resetModules();
  });

  test('creates client with env vars', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    // Force re-import to ensure mock/ENV considered
    const mod = await import('../../api/_utils/helpers/supabaseClient.js');
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'anon');
    expect(mod.supabase).toBeDefined();
  });
});
