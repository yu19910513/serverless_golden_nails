/**
 * @file Route handler for searching appointments.
 *
 * Implements the `GET /api/appointments/search` endpoint.
 * This handler searches for non-deleted appointments based on a keyword,
 * matching against customer, technician, and service fields.
 * @module api/appointments/_routes/searchAppointments
 */

import { searchAppointmentsByKeyword } from '../../_utils/queries/appointment.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * Handles the GET /api/appointments/search request.
 *
 * Passes the `keyword` query parameter to the `searchAppointmentsByKeyword`
 * helper and returns the results.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {string} [req.query.keyword] - The search term.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export async function searchAppointments(req, res) {
    const { keyword } = req.query;

    try {
        // 1. Delegate all business logic to the helper
        // The helper will correctly handle if 'keyword' is undefined
        const appointments = await searchAppointmentsByKeyword(keyword);

        // 2. Send Success Response
        return respond.ok(res, appointments);

    } catch (error) {
        // 3. Handle Errors
        console.error("Search error:", error);
        return respond.serverError(res, 'Failed to search appointments.', error);
    }
}