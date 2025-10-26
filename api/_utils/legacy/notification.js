import twilio from 'twilio';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { generateHtmlFromTemplate } from './helper.js';
import { appointmentMessage } from '../templates/templates.js';
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
 * Sends an email using Nodemailer with a Gmail transporter.
 *
 * @param {Object} email_object - Object containing email details.
 * @param {string|string[]} email_object.address - Recipient email address(es).
 * @param {string} email_object.subject - Subject line of the email.
 * @param {string} [email_object.text] - Plain text body of the email (optional).
 * @param {string} email_object.html - HTML body of the email.
 * @returns {Promise<Object|undefined>} Returns { success: false, error: string } on failure,
 * otherwise returns undefined if the email is sent successfully.
 */
export const sendEmail = async (email_object) => {
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
};

/**
 * Prepares and sends an email notification using the sendEmail service.
 *
 * This function generates the plain-text and HTML content for an email
 * and passes it to the sendEmail service.
 *
 * @param {string[]} recipients - An array of email addresses.
 * @param {string} subject - The subject line for the email.
 * @param {string} role - The recipient's role (e.g., "customer", "owner"), used for plain-text template.
 * @param {object} data_object - The data object containing details for the email templates.
 * @returns {Promise|void} A promise that resolves when the email is sent (from sendEmail),
 * or void if no recipients are provided.
 */
export const sendEmailNotification = (recipients, subject, role, data_object) => {
    if (!recipients.length) {
        console.warn(`No valid email provided for ${role}. Skipping email.`);
        return; // Return void explicitly
    }

    // **VITAL SERVERLESS CHANGE**: 'return' the promise from sendEmail.
    // In a serverless environment (like Vercel), the function
    // terminates as soon as a response is sent. We MUST return
    // this promise so the calling function can 'await' its
    // completion *before* sending the HTTP response.
    // Failing to do this will kill the email process mid-flight.
    return sendEmail({
        address: recipients,
        subject,
        text: appointmentMessage(data_object, role),
        html: generateHtmlFromTemplate({
            template: `appointment/${subject.toLowerCase().replace(/\s+/g, '_')}.handlebars`,
            content: data_object
        })
    });
};