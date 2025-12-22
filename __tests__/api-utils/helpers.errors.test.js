import { ClientError, OverlapError, NotFoundError, ConflictError } from '../../api/_utils/helpers/errors.js';

describe('helpers/errors', () => {
  test('ClientError sets name', () => {
    const e = new ClientError('oops');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ClientError');
    expect(e.message).toBe('oops');
  });
  test('OverlapError sets conflictingSlot', () => {
    const e = new OverlapError('bad', '10:00');
    expect(e.name).toBe('OverlapError');
    expect(e.conflictingSlot).toBe('10:00');
  });
  test('NotFoundError', () => {
    const e = new NotFoundError('missing');
    expect(e.name).toBe('NotFoundError');
  });
  test('ConflictError', () => {
    const e = new ConflictError('boom');
    expect(e.name).toBe('ConflictError');
  });
});
