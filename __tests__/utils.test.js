// __tests__/utils.test.js
import { isValidString } from '../api/_utils/validate.js';
import { respond } from '../api/_utils/response.js';
import { getMiscellaneousByTitle } from '../api/_utils/miscellaneous.js';
import { supabase } from '../api/_utils/supabaseClient.js';

// --- Mock Express response object ---
function createMockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

// --- Mock Supabase ---
jest.mock('../api/_utils/supabaseClient.js', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
            data: [{ title: 'Test', context: 'Some context' }],
            error: null,
        }),
    },
}));


describe('isValidString', () => {
    test('returns true for non-empty string', () => {
        expect(isValidString('hello')).toBe(true);
    });

    test('returns false for empty or whitespace string', () => {
        expect(isValidString('')).toBe(false);
        expect(isValidString('   ')).toBe(false);
    });

    test('returns false for non-string values', () => {
        expect(isValidString(123)).toBe(false);
        expect(isValidString(null)).toBe(false);
        expect(isValidString(undefined)).toBe(false);
        expect(isValidString({})).toBe(false);
    });
});

describe('respond', () => {
    test('badRequest sends 400 status with error message', () => {
        const res = createMockRes();
        respond.badRequest(res, 'Bad input');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Bad input' });
    });

    test('notFound sends 404 status with message', () => {
        const res = createMockRes();
        respond.notFound(res, 'Not found');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Not found' });
    });

    test('serverError sends 500 status with error message', () => {
        const res = createMockRes();
        respond.serverError(res, 'Server failed');
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server failed' });
    });
});

describe('getMiscellaneousByTitle', () => {
    test('returns data when title exists', async () => {
        const data = await getMiscellaneousByTitle('Test');
        expect(data).toEqual({ title: 'Test', context: 'Some context' });
    });

    test('returns null when no data', async () => {
        supabase.limit.mockResolvedValueOnce({ data: [], error: null });
        const data = await getMiscellaneousByTitle('Nonexistent');
        expect(data).toBeNull();
    });

    test('throws error when supabase returns an error', async () => {
        const error = new Error('DB error');
        supabase.limit.mockResolvedValueOnce({ data: null, error });
        await expect(getMiscellaneousByTitle('ErrorCase')).rejects.toThrow('DB error');
    });
});
