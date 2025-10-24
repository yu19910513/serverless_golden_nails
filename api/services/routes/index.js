import { getCategorizedServices } from '../../../utils/service.js';
import { respond } from '../../../utils/response.js';

/**
 * Express route handler to fetch all services grouped by category.
 *
 * @async
 * @function getServices
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 *
 * @returns {Promise<import('express').Response>} JSON response containing categorized services.
 *
 * @example
 * // GET /api/services
 * [
 *   {
 *     "id": 1,
 *     "name": "Nails",
 *     "services": [
 *       {
 *         "id": 101,
 *         "name": "Manicure",
 *         "description": "Basic nail cleaning and shaping",
 *         "price": 25,
 *         "time": 30,
 *         "category_id": 1
 *       }
 *     ]
 *   }
 * ]
 *
 * @throws Will send a 500 response if an error occurs while fetching services.
 */
export async function getServices(req, res) {
    try {
        const categorizedServices = await getCategorizedServices();
        return res.status(200).json(categorizedServices);
    } catch (err) {
        console.error('Error fetching categorized services:', err);
        return respond.serverError(res, 'An internal server error occurred while fetching services.');
    }
}
