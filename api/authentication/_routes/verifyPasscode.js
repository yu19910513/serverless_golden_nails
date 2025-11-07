import { verifyPasscodeAndSignToken } from '../../_utils/queries/authentication.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * Handles the POST /api/authentication/verify-passcode request.
 * Verifies a user's identifier and one-time passcode.
 * On success, returns a JSON Web Token (JWT).
 *
 * @param {import('express').Request} req - The Express request object, expected to contain `identifier` and `passcode` in the body.
 * @param {import('express').Response} res - The Express response object used to send the response.
 */
export async function verifyPasscode(req, res) {
    try {
        const { identifier, passcode } = req.body;
        if (!identifier || !passcode) {
            return respond.badRequest(res, 'Identifier and passcode are required.');
        }

        const token = await verifyPasscodeAndSignToken(identifier, passcode);

        if (!token) {
            return res.status(400).json({ message: 'Invalid identifier or passcode' });
        }

        res.status(200).json({ token });
    } catch (error) {
        console.error('Error in /verify-passcode:', error);
        respond.serverError(res, 'Internal server error');
    }
}