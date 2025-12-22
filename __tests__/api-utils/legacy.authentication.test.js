import { createMockRes } from '../../test-support/_testUtils.js';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => ({ data: { id: 1, admin_privilege: true } })),
  sign: jest.fn(() => 'token123'),
}));

import { authenticateUser, authorizeAdmin, basic_auth, getTokenExpiration, signToken } from '../../api/_utils/legacy/authentication.js';
import jwt from 'jsonwebtoken';

describe('legacy/authentication middlewares', () => {
  test('authenticateUser attaches user on valid token', () => {
    const req = { headers: { authorization: 'Bearer abc' } };
    const res = createMockRes();
    const next = jest.fn();
    process.env.JWT_SECRET = 'secret';

    authenticateUser(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('abc', 'secret');
    expect(req.user).toEqual({ id: 1, admin_privilege: true });
    expect(next).toHaveBeenCalled();
  });

  test('authorizeAdmin allows admins and rejects non-admin', () => {
    const req = { headers: { authorization: 'Bearer abc' } };
    const res = createMockRes();
    const next = jest.fn();
    process.env.JWT_SECRET = 'secret';

    authorizeAdmin(req, res, next);
    expect(next).toHaveBeenCalled();

    // Now simulate non-admin
    jwt.verify.mockReturnValueOnce({ data: { admin_privilege: false } });
    const req2 = { headers: { authorization: 'Bearer abc' } };
    const res2 = createMockRes();
    const next2 = jest.fn();
    authorizeAdmin(req2, res2, next2);
    expect(res2.status).toHaveBeenCalledWith(403);
  });

  test('basic_auth checks referer', () => {
    process.env.ALLOWED_REFERRERS = 'https://site.com,https://foo.com';
    const req = { get: (k) => (k === 'Referer' ? 'https://site.com/page' : '') };
    const res = createMockRes();
    const next = jest.fn();
    basic_auth(req, res, next);
    expect(next).toHaveBeenCalled();

    const reqBad = { get: () => 'https://evil.com' };
    const resBad = createMockRes();
    const nextBad = jest.fn();
    basic_auth(reqBad, resBad, nextBad);
    expect(resBad.status).toHaveBeenCalledWith(403);
  });
});

describe('legacy/authentication helpers', () => {
  test('getTokenExpiration returns proper defaults', () => {
    delete process.env.ADMIN_TOKEN_EXPIRATION;
    delete process.env.CUSTOMER_TOKEN_EXPIRATION;
    expect(getTokenExpiration(true)).toBe('1y');
    expect(getTokenExpiration(false)).toBe('2h');
  });

  test('signToken signs with secret and expiration', () => {
    process.env.JWT_SECRET = 's3cr3t';
    const t = signToken({ id: 1 }, '1h');
    expect(jwt.sign).toHaveBeenCalled();
    expect(t).toBe('token123');
  });
});
