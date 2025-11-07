import { getAvailableTechnicians } from '../../_utils/technician.js';
import { respond } from '../../_utils/response.js';

/**
 * @api {post} /api/technicians/available Get available technicians by category
 * @apiName GetAvailableTechnicians
 * @apiGroup Technicians
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getAvailable(req, res) {
    try {
        const { categoryIds } = req.body;

        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            return respond.badRequest(res, 'Category IDs are required.');
        }

        const technicians = await getAvailableTechnicians(categoryIds);
        res.status(200).json(technicians);
    } catch (err) {
        console.error("Error in /api/technicians/available handler:", err);
        respond.serverError(res, 'An internal server error occurred while fetching available technicians.');
    }
}