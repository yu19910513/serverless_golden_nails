/**
 * Represents a client-side input or validation error (HTTP 400).
 * Thrown when a request is malformed or contains invalid data.
 * 
 * @extends Error
 */
export class ClientError extends Error {
    /**
     * @param {string} message - A description of the validation failure.
     */
    constructor(message) {
        super(message);
        this.name = 'ClientError';
    }
}

/**
 * Represents a scheduling overlap conflict (HTTP 409).
 * Thrown when a new appointment conflicts with an existing time slot.
 * 
 * @extends Error
 */
export class OverlapError extends Error {
    /**
     * @param {string} message - A description of the overlap conflict.
     * @param {string} conflictingSlot - The conflicting time slot in 'HH:mm' format.
     */
    constructor(message, conflictingSlot) {
        super(message);
        this.name = 'OverlapError';
        this.conflictingSlot = conflictingSlot;
    }
}

/**
 * Represents a "Not Found" error (HTTP 404).
 * Thrown when a requested resource does not exist.
 * 
 * @extends Error
 */
export class NotFoundError extends Error {
    /**
     * @param {string} message - A description of the missing resource.
     */
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

/**
 * Represents a generic conflict error (HTTP 409).
 * Used when a request cannot be completed due to a conflict
 * that is not specifically an overlap.
 * 
 * @extends Error
 */
export class ConflictError extends Error {
    /**
     * @param {string} message - A description of the conflict.
     */
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
    }
}
