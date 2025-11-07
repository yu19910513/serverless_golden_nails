import { getAllActiveTechnicians } from '../../_utils/technician.js';
import { respond } from '../../_utils/response.js';

/**
 * @api {get} /api/technicians Get all active technicians
 * @apiName GetTechnicians
 * @apiGroup Technicians
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getAllTechnicians(req, res) {
    try {
        // Fetch the data using the abstracted utility function
        const technicians = await getAllActiveTechnicians();
        res.status(200).json(technicians);
    } catch (err) {
        console.error("Error in /api/technicians handler:", err);
        respond.serverError(res, 'An internal server error occurred while fetching technicians.');
    }
}