import { sendSMS, sendEmailNotification } from '../../_utils/notification.js';
import { appointmentMessage } from '../../_utils/templates/templates.js';
import { respond } from '../../_utils/response.js';

/**
 * Handles the POST /api/notification/notify request.
 *
 * Gathers all potential SMS and email notifications (for owner and customer)
 * and attempts to send them in parallel.
 *
 * This handler waits for all notification attempts to complete (succeed or fail)
 * before responding.
 *
 * - Responds with 200 OK if at least one notification is sent successfully.
 * - Responds with 500 Server Error if all attempted notifications fail.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {object} req.body - The request body.
 * @param {object} req.body.messageData - The notification payload.
 * @param {string} req.body.messageData.recipient_phone - The customer's phone number (required).
 * @param {string} [req.body.messageData.recipient_email_address] - The customer's email address.
 * @param {string} [req.body.messageData.owner_email_subject] - Subject line for the owner's email.
 * @param {string|boolean} [req.body.messageData.recipient_optInSMS] - Customer's SMS opt-in status.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<import('express').Response>} A JSON response.
 */
export async function postNotify(req, res) {
    try {
        const { messageData } = req.body;
        if (!messageData?.recipient_phone) {
            return res.status(400).json({ success: false, message: 'Invalid request. Ensure recipient_phone is provided.' });
        }

        const { OWNER_NUMBER, BUSINESS_EMAIL, STORE_EMAIL, OWNER_EMAIL } = process.env;

        const notificationPromises = [];

        if (OWNER_NUMBER) {
            notificationPromises.push(
                sendSMS(OWNER_NUMBER, appointmentMessage(messageData, "owner"))
            );
        }
        if (BUSINESS_EMAIL && STORE_EMAIL && messageData.owner_email_subject) {
            notificationPromises.push(
                sendEmailNotification([STORE_EMAIL, OWNER_EMAIL].filter(Boolean), messageData.owner_email_subject, "owner", messageData)
            );
        }
        if (messageData.recipient_email_address) {
            notificationPromises.push(
                sendEmailNotification([messageData.recipient_email_address], messageData.recipient_email_subject || "Appointment Notification", "customer", messageData)
            );
        }
        if (messageData.recipient_optInSMS !== 'false') {
            notificationPromises.push(
                sendSMS(messageData.recipient_phone, appointmentMessage(messageData, "customer"))
            );
        }

        if (notificationPromises.length === 0) {
            return res.status(200).json({ success: true, message: 'No notifications required.' });
        }

        const results = await Promise.allSettled(notificationPromises);

        const didAnySucceed = results.some(result => result.status === 'fulfilled');

        if (didAnySucceed) {
            // Log any individual failures for debugging, but still return success
            results.forEach(result => {
                if (result.status === 'rejected') {
                    console.warn('A notification failed to send:', result.reason);
                }
            });

            return res.status(200).json({ success: true, message: 'Notifications processed.' });
        } else {
            // All notifications failed
            console.error('All notifications failed:', results.map(r => r.reason));
            return respond.serverError(res, 'Failed to send any notifications.');
        }

    } catch (error) {
        // This catch is for unexpected errors (e.g., syntax error in this function)
        console.error('Critical error in postNotify:', error);
        return respond.serverError(res, `An unexpected error occurred: ${error.message}`);
    }
}