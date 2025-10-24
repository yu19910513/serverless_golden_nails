/**
 * @file Route handler for upcoming appointments.
 *
 * Implements the `GET /api/appointments/upcoming` endpoint.
 * This handler fetches all future (today or later) non-deleted
 * appointments for a specific technician.
 * @module api/appointments/_routes/getUpcoming
 */

import { supabase } from '../../_utils/supabaseClient.js';
import { respond } from '../../_utils/response.js';
import { DateTime } from 'luxon';

/**
 * Handles the GET /api/appointments/upcoming request.
 *
 * Performs a two-step query:
 * 1. Finds all appointment IDs associated with the `tech_id` from the
 * `appointmenttechnician` join table.
 * 2. Fetches the full details for those appointments that are on or after
 * the current date and are not marked as 'deleted'.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {object} req.query - The request query parameters.
 * @param {string} req.query.tech_id - The ID of the technician whose upcoming
 * appointments are to be fetched.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 * @throws {400} If the 'tech_id' query parameter is missing or invalid.
 * @throws {500} If a database error or other internal server error occurs.
 */
export async function getUpcoming(req, res) {
    const { tech_id } = req.query;

    if (!tech_id) {
        return respond.badRequest(res, 'Invalid or missing technician ID.');
    }

    try {
        const today = DateTime.now().toISODate(); // 'YYYY-MM-DD'

        // 1. Get all appointment IDs for this technician
        const { data: techAppointments, error: techError } = await supabase
            .from('appointmenttechnician') // Your join table
            .select('appointment_id')
            .eq('technician_id', tech_id);

        if (techError) throw techError;

        const appointmentIds = techAppointments.map(a => a.appointment_id);

        if (appointmentIds.length === 0) {
            return respond.ok(res, []); // No appointments for this tech
        }

        // 2. Get the full appointment details for those IDs
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                date,
                start_service_time,
                technicians (id, name),
                services (id, name, time)
            `)
            .in('id', appointmentIds)
            .gte('date', today) // date >= today
            .or('note.is.null,note.neq.deleted'); // (note IS NULL OR note != 'deleted')

        if (error) throw error;
        respond.ok(res, data);

    } catch (error) {
        console.error("Error fetching upcoming appointments:", error);
        respond.serverError(res, 'Failed to fetch appointments.', error);
    }
}