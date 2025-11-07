/**
 * Checks if a value is a non-empty string.
 *
 * @param {any} str - The value to check.
 * @returns {boolean} Returns `true` if `str` is a string with at least one non-whitespace character, otherwise `false`.
 *
 * @example
 * isValidString('hello'); // true
 * isValidString('   ');   // false
 * isValidString(123);     // false
 */
export function isValidString(str) {
    return typeof str === 'string' && str.trim() !== '';
}
