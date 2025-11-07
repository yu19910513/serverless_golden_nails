/**
 * @file Route handler for updating an appointment's note.
 *
 * Implements the `PUT /api/appointments/update_note` endpoint.
 * This handler updates the `note` field for a specific appointment.
 * @module api/appointments/_routes/updateNote
 */

import { updateAppointmentNote } from '../../_utils/queries/appointment.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * Handles the PUT /api/appointments/update_note request.
 *
 * Validates the request body and delegates the update logic
 * to the `updateAppointmentNote` helper.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {string|number} req.body.id - The ID of the appointment to update.
 * @param {string|null} req.body.note - The new note content.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export async function updateNote(req, res) {
    const { id, note } = req.body;

    // 1. Request Validation
    // Check for 'note' being undefined, allowing 'null' or '""'
    if (!id || note === undefined) {
        return respond.badRequest(res, 'Invalid or missing appointment ID or note.');
    }

    try {
        // 2. Delegate Business Logic
        await updateAppointmentNote(id, note);

        // 3. Send Success Response
        return respond.ok(res, { message: 'Appointment note updated successfully.' });

    } catch (error) {
        // 4. Handle Errors
        console.error("Error updating appointment note:", error);

        // Handle the specific error from our helper
        if (error.name === 'NotFoundError') {
            return respond.notFound(res, error.message);
        }

        // Handle all other errors
        return respond.serverError(res, 'Failed to update appointment.', error);
    }
}