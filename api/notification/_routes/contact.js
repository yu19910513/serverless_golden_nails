import { sendEmail } from '../../_utils/queries/notification.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * Handles the POST /api/notification/contact request.
 * Forwards a client message from the contact form to the business owner(s).
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {import('express').Response} A JSON response indicating success or failure.
 *
 * @throws {Error} Returns a 500 status code if an internal server error occurs.
 */
export async function postContact(req, res) {
    try {
        const { email_object } = req.body;
        
        if (process.env.BUSINESS_EMAIL && process.env.STORE_EMAIL) {
            await sendEmail({
                address: [process.env.STORE_EMAIL, process.env.OWNER_EMAIL].filter(Boolean),
                subject: `${email_object.name} (${email_object.email}) sent you a message`,
                text: email_object.message,
            });

            return res.status(200).json({
                success: true,
                message: 'Client message sent successfully!',
            });
        } else {
            console.warn('Missing BUSINESS_EMAIL or STORE_EMAIL env variables for /api/contact.');
            return res.status(400).json({ message: "Server is not configured to send this message." });
        }
    } catch (error) {
        console.error('Error in /contact handler:', error);
        return respond.serverError(res, `Failed to send the message: ${error.message}`);
    }
}