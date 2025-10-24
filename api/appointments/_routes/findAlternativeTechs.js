/**
 * @file Route handler for finding alternative technicians.
 *
 * Implements the `GET /api/appointments/find_alternative_techs` endpoint.
 * This handler finds all active technicians who are available
 * for the time slot of an existing appointment.
 * @module api/appointments/_routes/findAlternativeTechs
 */

import { supabase } from '../../_utils/supabaseClient.js';
import { respond } from '../../_utils/response.js';
import { okayToAssign } from '../../_utils/legacy/helper.js';

/**
 * Handles the GET /api/appointments/find_alternative_techs request.
 *
 * Fetches an existing appointment by its ID to determine its time slot and
 * service duration. It then queries all active technicians and checks their
 * availability for that specific time slot in parallel using the `okayToAssign` helper.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {object} req.query - The request query parameters.
 * @param {string} req.query.id - The ID of the existing appointment to check alternatives for.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 * @throws {400} If the 'id' query parameter is missing.
 * @throws {404} If the appointment with the given 'id' is not found.
 * @throws {500} If a database error or other internal server error occurs.
 */
export async function findAlternativeTechs(req, res) {
    const { id } = req.query;
    if (!id) return respond.badRequest(res, 'Missing appointment ID.');

    try {
        const { data: appointment, error: apptError } = await supabase
            .from('appointments')
            .select(`id, date, start_service_time, note, services (id, time)`)
            .eq('id', id)
            .or('note.is.null,note.neq.deleted')
            .single();

        if (apptError || !appointment) {
            return respond.notFound(res, 'Appointment not found.');
        }

        const { data: allTechnicians, error: techError } = await supabase
            .from('technicians')
            .select('id, name, description, unavailability')
            .eq('status', true);

        if (techError) throw techError;

        const availabilityChecks = allTechnicians.map(tech =>
            okayToAssign(tech, appointment)
        );

        const results = await Promise.all(availabilityChecks);
        const availableTechnicians = allTechnicians.filter((_, index) => results[index]);

        respond.ok(res, availableTechnicians);

    } catch (error) {
        console.error("Error finding alternative techs:", error);
        respond.serverError(res, 'Server error.', error);
    }
}