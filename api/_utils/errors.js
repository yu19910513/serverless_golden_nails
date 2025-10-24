/**
 * Custom error for client-side validation failures (400 Bad Request).
 * This error should be caught by the API handler and returned as a 400.
 * @extends Error
 */
export class ClientError extends Error {
    /**
     * @param {string} message - The validation error message.
     */
    constructor(message) {
        super(message);
        this.name = 'ClientError';
    }
}

/**
 * Custom error for scheduling overlaps (409 Conflict).
 * This error should be caught by the API handler and returned as a 409.
 * @extends Error
 */
export class OverlapError extends Error {
    /**
     * @param {string} message - The overlap error message.
     * @param {string} conflictingSlot - The 'HH:mm' time string that conflicts.
     */
    constructor(message, conflictingSlot) {
        super(message);
        this.name = 'OverlapError';
        this.conflictingSlot = conflictingSlot;
    }
}