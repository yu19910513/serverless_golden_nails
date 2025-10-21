import { getAvailableTechnicians } from '../../utils/technician.js';
import { respond } from '../../utils/response.js';

/**
 * @api {post} /api/technicians/available Get available technicians by category
 * @apiName GetAvailableTechnicians
 * @apiGroup Technicians
 */
export default async function handler(req, res) {
    // Ensure the request is a POST method
    if (req.method !== 'POST') {
        return respond.methodNotAllowed(res, req.method);
    }

    try {
        const { categoryIds } = req.body;

        // Validate input in the handler
        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            return respond.badRequest(res, 'Category IDs are required.');
        }

        // Fetch the data using the abstracted utility function
        const technicians = await getAvailableTechnicians(categoryIds);
        res.status(200).json(technicians);
    } catch (err) {
        console.error("Error in /api/technicians/available handler:", err);
        respond.serverError(res, 'An internal server error occurred while fetching available technicians.');
    }
}