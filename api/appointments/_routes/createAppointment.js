import { createAppointment } from '../../_utils/queries/appointment.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * @api {post} /api/appointments Create a new appointment
 * @apiName create
 * @apiGroup Appointments
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function create(req, res) {
    // The req.method check is removed
    // The router.post() in index.js handles this

    try {
        // Call the renamed utility function
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