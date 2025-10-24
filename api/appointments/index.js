import { createAppointment } from '../_utils/appointment.js';
import { respond } from '../_utils/response.js';

/**
 * API route handler for creating a new appointment.
 * Expects a POST request with appointment data in the body.
 *
 * @api {post} /api/appointments Create a new appointment
 * @apiName CreateAppointment
 * @apiGroup Appointments
 *
 * @param {object} req - The Vercel serverless request object.
 * @param {object} res - The Vercel serverless response object.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return respond.methodNotAllowed(res, req.method);
    }

    try {
        const newAppointment = await createAppointment(req.body);
        return respond.created(res, newAppointment);

    } catch (err) {
        console.error("Error in /api/appointments handler:", err);

        if (err.name === 'ClientError') {
            return respond.badRequest(res, err.message);
        }

        if (err.name === 'OverlapError') {
            return res.status(409).json({
                error: err.message,
                conflictingSlot: err.conflictingSlot,
            });
        }

        return respond.serverError(res, 'An internal server error occurred while creating the appointment.');
    }
}