import { validateCustomer } from '../../_utils/queries/customer.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * @api {get} /api/customers/validate Validate customer by phone and name
 * @apiName ValidateCustomer
 * @apiGroup Customers
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function validate(req, res) {
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