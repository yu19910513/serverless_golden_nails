/**
 * @file Route handler for the daily calendar view.
 *
 * Implements the `GET /api/appointments/calender` endpoint.
 * This handler fetches all appointments for a given date and
 * groups them by the technician assigned to them.
 * @module api/appointments/_routes/getCalendar
 */

import { getDailyCalendarByTechnician } from '../../_utils/queries/appointment.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * Handles the GET /api/appointments/calender request.
 *
 * Validates the 'date' query parameter, then delegates fetching
 * and processing to the `getDailyCalendarByTechnician` helper.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {string} req.query.date - The date to fetch appointments for.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export async function getCalendar(req, res) {
    const { date } = req.query;

    // 1. Request Validation
    if (!date) {
        return respond.badRequest(res, 'Date parameter is required.');
    }

    try {
        // 2. Delegate Business Logic
        const calendarData = await getDailyCalendarByTechnician(date);

        // 3. Send Success Response
        // An empty array is a valid response (no appointments for that day)
        return respond.ok(res, calendarData);

    } catch (error) {
        // 4. Handle Errors
        console.error("Error fetching calendar appointments:", error);
        return respond.serverError(res, 'Failed to fetch appointments.', error);
    }
}