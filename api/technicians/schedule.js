import { getTechnicianSchedule } from '../_utils/technician.js';
import { respond } from '../_utils/response.js';

/**
 * @api {get} /api/technicians/schedule Get technician schedule by date
 * @apiName GetTechnicianSchedule
 * @apiGroup Technicians
 */
export default async function handler(req, res) {
    // Ensure the request is a GET method
    if (req.method !== 'GET') {
        return respond.methodNotAllowed(res, req.method);
    }

    try {
        const { date } = req.query;

        // Validate input in the handler
        if (!date) {
            return respond.badRequest(res, 'Date parameter is required.');
        }

        // Fetch the data using the abstracted utility function
        const schedule = await getTechnicianSchedule(date);
        res.status(200).json(schedule);
    } catch (err) {
        console.error("Error in /api/technicians/schedule handler:", err);
        respond.serverError(res, 'An internal server error occurred while fetching the schedule.');
    }
}