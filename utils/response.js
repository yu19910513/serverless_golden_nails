// /utils/response.js

/**
 * Helper functions to send standardized HTTP responses.
 *
 * @namespace respond
 */
export const respond = {
    /**
     * Sends a 400 Bad Request response.
     *
     * @param {import('express').Response} res - The Express response object.
     * @param {string} msg - The error message to send.
     */
    badRequest: (res, msg) => res.status(400).json({ error: msg }),

    /**
     * Sends a 404 Not Found response.
     *
     * @param {import('express').Response} res - The Express response object.
     * @param {string} msg - The message to send.
     */
    notFound: (res, msg) => res.status(404).json({ message: msg }),

    /**
     * Sends a 500 Internal Server Error response.
     *
     * @param {import('express').Response} res - The Express response object.
     * @param {string} msg - The error message to send.
     */
    serverError: (res, msg) => res.status(500).json({ error: msg }),
};
