import { smartSearchCustomers } from '../../_utils/queries/customer.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * @api {get} /api/customers/smart_search Smart search for customers
 * @apiName SmartSearchCustomers
 * @apiGroup Customers
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function smartSearch(req, res) {
    // The helper function handles all logic for empty, "*", or a search term.
    const keyword = (req.query.keyword || '').trim().toLowerCase();

    try {
        const customers = await smartSearchCustomers(keyword);
        res.status(200).json(customers);
    } catch (err) {
        console.error('Customer smart search error:', err);
        respond.serverError(res, 'Failed to search customers.');
    }
}