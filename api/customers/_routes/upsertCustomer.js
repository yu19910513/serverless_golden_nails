import { upsertCustomer } from '../../_utils/queries/customer.js'; // Kept original import
import { respond } from '../../_utils/helpers/response.js';

/**
 * @api {put} /api/customers Create or update a customer
 * @apiName UpsertCustomer
 * @apiGroup Customers
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function handleUpsertCustomer(req, res) { // Renamed the handler
    const { id, name, phone } = req.body;

    // Validation
    if (!id && (!name || !phone)) {
        return respond.badRequest(res, 'Name and phone are required for new customers.');
    }

    try {
        // This now correctly calls the imported utility
        const { customer, status } = await upsertCustomer(req.body);

        // Handle the different outcomes
        if (status === 'not-found') {
            return res.status(44).json({ message: 'Customer not found.' });
        }
        if (status === 'created') {
            return res.status(201).json({ message: 'Customer created.', customer });
        }
        if (status === 'updated-by-id') {
            return res.status(200).json({ message: 'Customer updated by ID.', customer });
        }
        if (status === 'updated-by-phone') {
            return res.status(200).json({ message: 'Customer updated by phone.', customer });
        }
    } catch (err) {
        console.error('Error processing customer:', err);
        respond.serverError(res, 'Internal server error.');
    }
}