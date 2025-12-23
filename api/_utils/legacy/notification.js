import twilio from 'twilio';
import dotenv from 'dotenv';
import nodemailer from "nodemailer";
import { generateHtmlFromTemplate } from "./helper.js";
import { appointmentMessage } from './templates/templates';
dotenv.config();


/**
 * Sends an SMS message using Twilio.
 *
 * @param {string} recipientPhoneNumber - The recipient's phone number. Can start with '+' or will default to +1 (US).
 * @param {string} message - The message content to send.
 * @returns {Promise<Object>} Returns the Twilio message object if successful,
 * or an object with { success: false, error: string } if there was an error.
 */
export const sendSMS = async (recipientPhoneNumber, message) => {
    try {
        const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        const sms = await client.messages.create({
            body: message,
            from: `+1${process.env.TWILIO_NUMBER}`,  // Your Twilio phone number
            to: recipientPhoneNumber.startsWith('+') ? recipientPhoneNumber : `+1${recipientPhoneNumber}`
        });

        console.log(`Message sent with SID: ${sms.sid}`);
        return sms;  // Return message object for further handling if needed
    } catch (err) {
        console.error('Error sending message:', err);
        // throw err;  // Rethrow error so the caller can handle it
        return { success: false, error: err.message };
    }
};


/**
 * Email sending utilities.
 *
 * Provides `sendEmail`, a convenience method that sends email via a Gmail
 * transporter configured with environment variables.
 *
 * Environment variables:
 * - `BUSINESS_EMAIL`: Sender email address (Gmail).
 * - `APP_PASSWORD`: Gmail App Password for the sender account.
 *
 * Return semantics:
 * - Resolves to `undefined` on success.
 * - Resolves to `{ success: false, error: string }` on failure (non-throwing).
 */
export const emailApi = {
    /**
     * Sends an email using Nodemailer with a Gmail transporter.
     *
     * @param {Object} email_object - Email payload.
     * @param {string|string[]} email_object.address - Recipient email address(es).
     * @param {string} email_object.subject - Subject line.
     * @param {string} [email_object.text] - Optional plain-text body.
     * @param {string} email_object.html - HTML body.
     * @returns {Promise<void | { success: false, error: string }>} `undefined` on success,
     * or an object describing the failure.
     */
    sendEmail: async (email_object) => {
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.BUSINESS_EMAIL, // Sender email
                    pass: process.env.APP_PASSWORD, // App password
                },
            });

            const mailOptions = {
                from: process.env.BUSINESS_EMAIL,
                to: email_object.address, // Supports string or array
                subject: email_object.subject,
                text: email_object.text, // Optional plain text fallback
                html: email_object.html, // HTML version
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${email_object.address}:`, info.response);
        } catch (error) {
            console.error("Failed to send email:", error.message);
            // throw error; // Propagate error
            return { success: false, error: error.message };
        }
    }
};

/**
 * Composes and dispatches an appointment email notification.
 *
 * Builds a plain-text message via `appointmentMessage(data_object, role)` and an
 * HTML body via `generateHtmlFromTemplate` using a template inferred from the
 * `subject` (e.g., "New Appointment" → `appointment/new_appointment.handlebars`).
 *
 * Non-blocking behavior: this function does not `await` the actual send; it
 * dispatches `emailApi.sendEmail(...)` and returns immediately. If `recipients`
 * is empty, it logs a warning and does nothing.
 *
 * @param {string[]} recipients - Recipient email addresses.
 * @param {string} subject - Email subject; used to infer the template path.
 * @param {string} role - Recipient role for text message composition (e.g., "owner", "customer").
 * @param {Object} data_object - Data used to render text and HTML templates.
 * @returns {void}
 * @example
 * sendEmailNotification(
 *   ['a@example.com', 'b@example.com'],
 *   'New Appointment',
 *   'owner',
 *   { action: 'confirm', recipient_name: 'Ada' }
 * );
 */
export const sendEmailNotification = (recipients, subject, role, data_object) => {
    if (!recipients.length) return console.warn(`No valid email provided for ${role}. Skipping email.`);
    emailApi.sendEmail({
        address: recipients,
        subject,
        text: appointmentMessage(data_object, role),
        html: generateHtmlFromTemplate({
            template: `appointment/${subject.toLowerCase().replace(/\s+/g, '_')}.handlebars`,
            content: data_object
        })
    });
};

/**
 * Named export for direct email sending.
 *
 * Alias for `emailApi.sendEmail` with the same signature and return semantics.
 *
 * @type {(email_object: { address: string|string[], subject: string, text?: string, html: string })
 *   => Promise<void | { success: false, error: string }>>}
 */
export const sendEmail = emailApi.sendEmail;

export default {
    sendSMS,
    sendEmail,
    sendEmailNotification,
    emailApi,
};
