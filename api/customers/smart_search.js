import { smartSearchCustomers } from '../../utils/customer.js';
import { respond } from '../../utils/response.js';

/**
 * @api {get} /api/customers/smart_search Smart search for customers
 * @apiName SmartSearchCustomers
 * @apiGroup Customers
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return respond.methodNotAllowed(res, req.method);
    }

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