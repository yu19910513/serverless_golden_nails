// We only need one helper function now
import { verifyPasscodeAndSignToken } from '../../utils/authentication.js';
import { respond } from '../../utils/response.js';

/**
 * @api {post} /api/authentication/verify-passcode Verify passcode and get token
 * @apiName VerifyPasscode
 * @apiGroup Authentication
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return respond.methodNotAllowed(res, req.method);
    }

    try {
        const { identifier, passcode } = req.body;
        if (!identifier || !passcode) {
            return respond.badRequest(res, 'Identifier and passcode are required.');
        }

        // The helper now does all the work:
        // 1. Find customer
        // 2. Verify passcode
        // 3. Clear passcode
        // 4. Sign token
        const token = await verifyPasscodeAndSignToken(identifier, passcode);

        // If the helper returns null, verification failed
        if (!token) {
            return res.status(400).json({ message: 'Invalid identifier or passcode' });
        }

        // Success! Return the token.
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error in /verify-passcode:', error);
        respond.serverError(res, 'Internal server error');
    }
}