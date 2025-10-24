import { validateCustomer } from '../_utils/customer.js';
import { respond } from '../_utils/response.js';

/**
 * @api {get} /api/customers/validate Validate customer by phone and name
 * @apiName ValidateCustomer
 * @apiGroup Customers
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return respond.methodNotAllowed(res, req.method);
    }

    const { phone, name } = req.query;

    if (!phone || !name || phone.trim() === '' || name.trim() === '') {
        return respond.badRequest(res, 'Both phone and name are required.');
    }

    try {
        const customer = await validateCustomer(phone.trim(), name.trim());

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        res.status(200).json(customer);
    } catch (err) {
        console.error('Error validating customer:', err);
        respond.serverError(res, 'An error occurred while validating the customer.');
    }
}