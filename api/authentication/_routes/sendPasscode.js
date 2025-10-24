import { findCustomerAndSendPasscode } from '../../../utils/authentication.js';
import { respond } from '../../../utils/response.js';

/**
 * Handles the POST /api/authentication/send-passcode request.
 * Finds a customer by their identifier (email or phone) and sends them a one-time passcode.
 *
 * @param {import('express').Request} req - The Express request object, expected to contain an `identifier` in the body.
 * @param {import('express').Response} res - The Express response object used to send the response.
 */
export async function sendPasscode(req, res) {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return respond.badRequest(res, 'Identifier required');
        }

        const wasSuccessful = await findCustomerAndSendPasscode(identifier);

        if (!wasSuccessful) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json({ message: 'Passcode sent' });
    } catch (error) {
        console.error('Error in /send-passcode:', error);
        respond.serverError(res, 'Internal server error');
    }
}