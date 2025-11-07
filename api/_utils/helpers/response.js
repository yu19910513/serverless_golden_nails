// /utils/response.js

/**
 * Helper functions to send standardized HTTP responses.
 *
 * @namespace respond
 */
export const respond = {
    /**
     * Sends a 200 OK response with optional data.
     *
     * @param {import('express').Response} res - Express response object
     * @param {any} [data] - Optional payload to send
     */
    ok: (res, data = {}) => res.status(200).json(data),

    /**
     * Sends a 201 Created response with optional data.
     *
     * @param {import('express').Response} res - Express response object
     * @param {any} [data] - Optional payload to send
     */
    created: (res, data = {}) => res.status(201).json(data),

    /**
     * Sends a 400 Bad Request response.
     *
     * @param {import('express').Response} res - Express response object
     * @param {string} msg - The error message
     */
    badRequest: (res, msg) => res.status(400).json({ error: msg }),

    /**
     * Sends a 401 Unauthorized response.
     *
     * @param {import('express').Response} res - Express response object
     * @param {string} msg - The error message
     */
    unauthorized: (res, msg) => res.status(401).json({ error: msg }),

    /**
     * Sends a 403 Forbidden response.
     *
     * @param {import('express').Response} res - Express response object
     * @param {string} msg - The error message
     */
    forbidden: (res, msg) => res.status(403).json({ error: msg }),

    /**
     * Sends a 404 Not Found response.
     *
     * @param {import('express').Response} res - Express response object
     * @param {string} msg - The message to send
     */
    notFound: (res, msg) => res.status(404).json({ message: msg }),

    /**
     * Sends a 409 Conflict response.
     *
     * @param {import('express').Response} res - Express response object
     * @param {string} msg - The error message
     */
    conflict: (res, msg) => res.status(409).json({ error: msg }),

    /**
     * Sends a 500 Internal Server Error response.
     *
     * @param {import('express').Response} res - Express response object
     * @param {string} msg - The error message
     */
    serverError: (res, msg) => res.status(500).json({ error: msg }),

    /**
     * Sends a 405 Method Not Allowed response.
     *
     * @param {import('express').Response} res - Express response object
     * @param {string} method - The HTTP method that is not allowed
     */
    methodNotAllowed: (res, method) =>
        res.status(405).json({ error: `Method ${method} not allowed` }),
};
