import { getTechnicianSchedule } from '../../_utils/technician.js';
import { respond } from '../../_utils/response.js';

/**
 * @api {get} /api/technicians/schedule Get technician schedule by date
 * @apiName GetTechnicianSchedule
 * @apiGroup Technicians
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getSchedule(req, res) {
    try {
        const { date } = req.query;

        if (!date) {
            return respond.badRequest(res, 'Date parameter is required.');
        }

        const schedule = await getTechnicianSchedule(date);
        res.status(200).json(schedule);
    } catch (err) {
        console.error("Error in /api/technicians/schedule handler:", err);
        respond.serverError(res, 'An internal server error occurred while fetching the schedule.');
    }
}