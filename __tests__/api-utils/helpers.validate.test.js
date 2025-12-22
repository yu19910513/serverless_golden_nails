import { isValidString } from '../../api/_utils/helpers/validate.js';

describe('helpers/validate.isValidString', () => {
  it('returns true for non-empty strings', () => {
    expect(isValidString('hello')).toBe(true);
    expect(isValidString('  world ')).toBe(true);
  });
  it('returns false for empty, whitespace, or non-string', () => {
    expect(isValidString('')).toBe(false);
    expect(isValidString('   ')).toBe(false);
    expect(isValidString(null)).toBe(false);
    expect(isValidString(undefined)).toBe(false);
    expect(isValidString(123)).toBe(false);
  });
});
