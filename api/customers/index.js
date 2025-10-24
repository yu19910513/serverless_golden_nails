import { upsertCustomer } from '../_utils/customer.js';
import { respond } from '../_utils/response.js';

/**
 * @api {put} /api/customers Create or update a customer
 * @apiName UpsertCustomer
 * @apiGroup Customers
 */
export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return respond.methodNotAllowed(res, req.method);
    }

    const { id, name, phone } = req.body;

    // Validation from original logic: name and phone are required IF it's not
    // an update-by-id.
    if (!id && (!name || !phone)) {
        return respond.badRequest(res, 'Name and phone are required for new customers.');
    }

    try {
        // The helper function contains all the complex logic
        const { customer, status } = await upsertCustomer(req.body);

        // Handle the different outcomes
        if (status === 'not-found') {
            return res.status(404).json({ message: 'Customer not found.' });
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