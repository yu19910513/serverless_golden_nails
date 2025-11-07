import { searchCustomerByPhone } from '../../_utils/queries/customer.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * @api {get} /api/customers/search Search customer by phone
 * @apiName SearchCustomer
 * @apiGroup Customers
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function searchCustomer(req, res) {
    const { phone } = req.query;

    if (!phone) {
        return respond.badRequest(res, 'Phone number is required.');
    }

    try {
        const customer = await searchCustomerByPhone(phone);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        res.status(200).json(customer);
    } catch (err) {
        console.error('Error searching customer:', err);
        respond.serverError(res, 'An error occurred while searching for the customer.');
    }
}