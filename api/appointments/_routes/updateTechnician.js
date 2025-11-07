/**
 * @file Route handler for updating an appointment's assigned technician.
 *
 * Implements the `PUT /api/appointments/update_technician` endpoint.
 * This handler reassigns an existing appointment to a new technician.
 * @module api/appointments/_routes/updateTechnician
 */

import { reassignAppointmentTechnician } from '../../_utils/queries/appointment.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * Handles the PUT /api/appointments/update_technician request.
 *
 * Validates the request body and delegates the full reassignment
 * logic to the `reassignAppointmentTechnician` helper.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {string|number} req.body.id - The ID of the appointment to update.
 * @param {string|number} req.body.technician_id - The ID of the new technician.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export async function updateTechnician(req, res) {
    const { id, technician_id } = req.body;

    // 1. Request Validation
    if (!id || !technician_id) {
        return respond.badRequest(res, 'Missing appointment ID or technician ID.');
    }

    try {
        // 2. Delegate Business Logic
        const updatedTechnician = await reassignAppointmentTechnician(id, technician_id);

        // 3. Send Success Response
        return respond.ok(res, {
            message: 'Technician updated successfully.',
            updatedTechnician: updatedTechnician
        });

    } catch (error) {
        // 4. Handle Specific Errors
        console.error("Error updating technician:", error);

        if (error.name === 'NotFoundError') {
            return respond.notFound(res, error.message);
        }

        if (error.name === 'ConflictError') {
            // Assuming 'respond.conflict' is your 409 helper
            return respond.conflict(res, error.message);
        }

        // 5. Handle Generic Errors
        return respond.serverError(res, 'Server error.', error);
    }
}