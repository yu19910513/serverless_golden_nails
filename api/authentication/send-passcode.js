// Imports are now much cleaner
import { findCustomerAndSendPasscode } from '../../utils/authentication.js';
import { respond } from '../../utils/response.js';

/**
 * @api {post} /api/authentication/send-passcode Send a login passcode
 * @apiName SendPasscode
 * @apiGroup Authentication
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return respond.methodNotAllowed(res, req.method);
    }

    try {
        const { identifier } = req.body;
        if (!identifier) {
            return respond.badRequest(res, 'Identifier required');
        }

        // The helper now does all the work (find, save, and send)
        // It returns true if successful, false if not found.
        const wasSuccessful = await findCustomerAndSendPasscode(identifier);

        if (!wasSuccessful) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // If successful, just send OK
        res.status(200).json({ message: 'Passcode sent' });
    } catch (error) {
        console.error('Error in /send-passcode:', error);
        respond.serverError(res, 'Internal server error');
    }
}