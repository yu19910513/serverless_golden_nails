/**
 * @file Route handler for finding alternative technicians.
 *
 * Implements the `GET /api/appointments/find_alternative_techs` endpoint.
 * This handler finds all active technicians who are available
 * for the time slot of an existing appointment.
 * @module api/appointments/_routes/findAlternativeTechs
 */

// Import the *new* helper function
import { getAlternativeTechs } from '../../_utils/appointment.js';
import { respond } from '../../_utils/response.js';

/**
 * Handles the GET /api/appointments/find_alternative_techs request.
 *
 * Delegates the core logic to `getAlternativeTechs` and handles
 * request validation and response formatting.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {string} req.query.id - The ID of the existing appointment.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export async function findAlternativeTechs(req, res) {
    const { id } = req.query;

    // 1. Request Validation
    if (!id) {
        return respond.badRequest(res, 'Missing appointment ID.');
    }

    try {
        // 2. Delegate Business Logic
        const availableTechnicians = await getAlternativeTechs(id);

        // 3. Send Success Response
        return respond.ok(res, availableTechnicians);

    } catch (error) {
        console.error("Error finding alternative techs:", error);

        // 4. Handle Specific Errors from the helper
        if (error.name === 'NotFoundError') {
            return respond.notFound(res, error.message);
        }

        // 5. Handle Generic Errors
        return respond.serverError(res, 'Server error.', error);
    }
}