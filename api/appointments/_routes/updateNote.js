/**
 * @file Route handler for updating an appointment's note.
 *
 * Implements the `PUT /api/appointments/update_note` endpoint.
 * This handler updates the `note` field for a specific appointment.
 * @module api/appointments/_routes/updateNote
 */

import { supabase } from '../../_utils/supabaseClient.js';
import { respond } from '../../_utils/response.js';

/**
 * Handles the PUT /api/appointments/update_note request.
 *
 * Updates the `note` field of a single appointment specified by its `id`.
 * It uses `.select('id')` and `.single()` to ensure that the appointment
 * exists. If the update query returns no data or a 'PGRST116' error,
 * it returns a 404 Not Found response.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {object} req.body - The request body.
 * @param {string|number} req.body.id - The ID of the appointment to update.
 * @param {string|null} req.body.note - The new note content.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 * @throws {400} If the 'id' or 'note' is missing from the request body.
 * @throws {404} If no appointment is found with the provided 'id'.
 * @throws {500} If a database error or other internal server error occurs.
 */
export async function updateNote(req, res) {
    const { id, note } = req.body;

    if (!id || note === undefined) {
        return respond.badRequest(res, 'Invalid or missing appointment ID or note.');
    }

    try {
        const { data, error } = await supabase
            .from('appointments')
            .update({ note: note })
            .eq('id', id)
            .select('id') // Request the 'id' back to confirm success
            .single(); // Ensures it fails if ID doesn't exist

        if (error) {
            if (error.code === 'PGRST116') { // PostgREST code for "not found"
                return respond.notFound(res, 'Appointment not found.');
            }
            throw error;
        }

        if (!data) {
            return respond.notFound(res, 'Appointment not found.');
        }

        respond.ok(res, { message: 'Appointment note updated successfully.' });

    } catch (error) {
        console.error("Error updating appointment note:", error);
        respond.serverError(res, 'Failed to update appointment.', error);
    }
}