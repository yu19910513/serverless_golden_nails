import { findCustomerAndSendPasscode, verifyPasscodeAndSignToken } from '../../api/_utils/queries/authentication.js';

jest.mock('../../api/_utils/helpers/supabaseClient.js', () => {
  const supabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1, email: 'a@b.com', phone: '123', passcode: '111111', admin_privilege: false }, error: null }),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  };
  return { supabase };
});

import { supabase as supabaseMock } from '../../api/_utils/helpers/supabaseClient.js';

jest.mock('../../api/_utils/legacy/notification.js', () => ({
  sendEmail: jest.fn(async () => undefined),
  sendSMS: jest.fn(async () => ({ sid: 'sm' })),
}));

jest.mock('../../api/_utils/legacy/helper.js', () => ({
  validateContactType: jest.fn((s) => (s.includes('@') ? 'email' : 'phone')),
}));

jest.mock('../../api/_utils/legacy/authentication.js', () => ({
  signToken: jest.fn(() => 'jwt-token'),
  getTokenExpiration: jest.fn(() => '2h'),
}));

import { sendEmail, sendSMS } from '../../api/_utils/legacy/notification.js';
import { signToken } from '../../api/_utils/legacy/authentication.js';

describe('queries/authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findCustomerAndSendPasscode sends email or SMS', async () => {
    const ok = await findCustomerAndSendPasscode('a@b.com');
    expect(ok).toBe(true);
    expect(sendEmail).toHaveBeenCalled();

    // For phone
    const ok2 = await findCustomerAndSendPasscode('123');
    expect(ok2).toBe(true);
    expect(sendSMS).toHaveBeenCalled();
  });

  test('verifyPasscodeAndSignToken returns token on match', async () => {
    // First call returns customer with passcode 111111
    const token = await verifyPasscodeAndSignToken('a@b.com', '111111');
    expect(token).toBe('jwt-token');
    expect(signToken).toHaveBeenCalled();
  });
});
