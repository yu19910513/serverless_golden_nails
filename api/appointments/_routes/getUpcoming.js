/**
 * @file Route handler for upcoming appointments.
 *
 * Implements the `GET /api/appointments/upcoming` endpoint.
 * This handler fetches all future (today or later) non-deleted
 * appointments for a specific technician.
 * @module api/appointments/_routes/getUpcoming
 */

import { getUpcomingAppointmentsForTech } from '../../_utils/appointment.js';
import { respond } from '../../_utils/response.js';
// No longer need supabase or luxon here

/**
 * Handles the GET /api/appointments/upcoming request.
 *
 * Validates the 'tech_id' and delegates fetching logic to
 * the `getUpcomingAppointmentsForTech` helper.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {string} req.query.tech_id - The ID of the technician.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export async function getUpcoming(req, res) {
    const { tech_id } = req.query;

    // 1. Request Validation
    if (!tech_id) {
        return respond.badRequest(res, 'Invalid or missing technician ID.');
    }

    try {
        // 2. Delegate Business Logic
        const upcomingAppointments = await getUpcomingAppointmentsForTech(tech_id);

        // 3. Send Success Response
        // The helper returns [] if no appointments, which is a valid OK response
        return respond.ok(res, upcomingAppointments);

    } catch (error) {
        // 4. Handle Errors
        console.error("Error fetching upcoming appointments:", error);
        return respond.serverError(res, 'Failed to fetch appointments.', error);
    }
}