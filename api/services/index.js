import { getCategorizedServices } from '../../utils/service.js';
import { respond } from '../../utils/response.js';

/**
 * @api {get} /api/services Get all services grouped by category
 * @apiName GetServices
 * @apiGroup Services
 *
 * @apiSuccess {Object[]} categories List of categories with their services.
 * @apiSuccess {Number} categories.id Category ID.
 * @apiSuccess {String} categories.name Category name.
 * @apiSuccess {Object[]} categories.services List of services in this category.
 *
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * [
 * {
 * "id": 1,
 * "name": "Nails",
 * "services": [
 * {
 * "id": 101,
 * "name": "Manicure",
 * "description": "Basic nail cleaning and shaping",
 * "price": 25,
 * "time": 30,
 * "category_id": 1
 * }
 * ]
 * }
 * ]
 *
 * @apiError (500) {String} error An error message explaining the issue.
 */
export default async function handler(req, res) {
    // Ensure the request is a GET method
    if (req.method !== 'GET') {
        return respond.methodNotAllowed(res, req.method);
    }

    try {
        // Fetch the data using the abstracted utility function
        const categorizedServices = await getCategorizedServices();
        res.status(200).json(categorizedServices);
    } catch (err) {
        console.error("Error in /api/services handler:", err);
        respond.serverError(res, 'An internal server error occurred while fetching services.');
    }
}
