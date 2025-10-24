/**
 * @file Route handler for updating an appointment's assigned technician.
 *
 * Implements the `PUT /api/appointments/update_technician` endpoint.
 * This handler reassigns an existing appointment to a new technician,
 * first verifying the technician's availability.
 * @module api/appointments/_routes/updateTechnician
 */

import { supabase } from '../../_utils/supabaseClient.js';
import { respond } from '../../_utils/response.js';
import { okayToAssign } from '../../_utils/legacy/helper.js';

/**
 * Handles the PUT /api/appointments/update_technician request.
 *
 * Fetches both the appointment and the target technician. It then uses
 * the `okayToAssign` helper to check if the technician is available
 * for the appointment's time slot. If available, it updates the
 * `appointmenttechnician` join table by deleting old entries for that
 * appointment and inserting the new assignment.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {object} req.body - The request body.
 * @param {string|number} req.body.id - The ID of the appointment to update.
 * @param {string|number} req.body.technician_id - The ID of the new technician to assign.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 * @throws {400} If 'id' or 'technician_id' is missing from the request body.
 * @throws {404} If the appointment or technician is not found.
 * @throws {409} If the technician is not available for the appointment time.
 * @throws {500} If a database error or other internal server error occurs.
 */
export async function updateTechnician(req, res) {
    const { id, technician_id } = req.body;
    if (!id || !technician_id) {
        return respond.badRequest(res, 'Missing appointment ID or technician ID.');
    }

    try {
        const { data: technician, error: techError } = await supabase
            .from('technicians')
            .select('id, name, description, unavailability')
            .eq('id', technician_id)
            .single();

        const { data: appointment, error: apptError } = await supabase
            .from('appointments')
            .select('id, date, start_service_time, services(id, time)')
            .eq('id', id)
            .single();

        if (techError || !technician) return respond.notFound(res, 'Technician not found.');
        if (apptError || !appointment) return respond.notFound(res, 'Appointment not found.');

        const isAvailable = await okayToAssign(technician, appointment);

        if (!isAvailable) {
            return respond.conflict(res, 'Technician is not available.');
        }

        await supabase.from('appointmenttechnician').delete().eq('appointment_id', id);
        await supabase.from('appointmenttechnician').insert({
            appointment_id: id,
            technician_id: technician_id
        });

        respond.ok(res, {
            message: 'Technician updated successfully.',
            updatedTechnician: technician
        });

    } catch (error) {
        console.error("Error updating technician:", error);
        respond.serverError(res, 'Server error.', error);
    }
}