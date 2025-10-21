import { getAllActiveTechnicians } from '../../utils/technician.js';
import { respond } from '../../utils/response.js';

/**
 * @api {get} /api/technicians Get all active technicians
 * @apiName GetTechnicians
 * @apiGroup Technicians
 */
export default async function handler(req, res) {
    // Ensure the request is a GET method
    if (req.method !== 'GET') {
        return respond.methodNotAllowed(res, req.method);
    }

    try {
        // Fetch the data using the abstracted utility function
        const technicians = await getAllActiveTechnicians();
        res.status(200).json(technicians);
    } catch (err) {
        console.error("Error in /api/technicians handler:", err);
        respond.serverError(res, 'An internal server error occurred while fetching technicians.');
    }
}